import { model } from '../config/gemini';
import { CreateCourseData } from '../types/course';
import {
  generateCoursePrompt,
  generatePreviewPrompt,
  generateSubtopicContentPrompt,
} from '../utils/prompts';
import Course, { ICourse } from '../models/mongodb/Course';

export class GeminiService {
  /**
   * Generates content for a specific course topic.
   * @param data - The course data including title, description, and type.
   * @param currentTopicIndex - The index of the topic to generate content for.
   * @returns The generated topic with its subtopics.
   */
  async generateCourseContent(
    data: CreateCourseData,
    currentTopicIndex: number = 0
  ) {
    const prompt = generateCoursePrompt(data, currentTopicIndex);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    const cleanedText = text.replace(/```json\n?|\n?```/g, '');
    const parsedContent = JSON.parse(cleanedText);
    const topic = parsedContent.topic;

    return {
      title: topic.title,
      content: currentTopicIndex === 0 ? topic.content || '' : '',
      order: currentTopicIndex + 1,
      status: currentTopicIndex === 0 ? 'complete' : 'incomplete',
      subtopics: topic.subtopics.map((subtopic: any, subIndex: number) => ({
        title: subtopic.title,
        content: currentTopicIndex === 0 ? subtopic.theory : '',
        order: subIndex + 1,
        status: currentTopicIndex === 0 ? 'complete' : 'incomplete',
      })),
    };
  }

  /**
   * Generates a preview for a course.
   * @param data - The course data including title, description, and subtopics.
   * @returns The generated preview topics.
   */
  async generatePreview(data: CreateCourseData) {
    const prompt = generatePreviewPrompt(data);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    const cleanedText = text.replace(/```json\n?|\n?```/g, '');
    const parsedContent = JSON.parse(cleanedText);

    return {
      topics: parsedContent[data.title.toLowerCase()].map((topic: any) => ({
        title: topic.title,
        content: '',
        subtopics: topic.subtopics.map((subtopic: any) => ({
          title: subtopic.title,
          content: '',
        })),
      })),
    };
  }

  /**
   * Generates content for a specific subtopic.
   * @param courseId - The ID of the course.
   * @param topicId - The ID of the topic.
   * @param subtopicId - The ID of the subtopic.
   * @returns The updated subtopic with generated content.
   */
  async generateSubtopicContent(
    courseId: string,
    topicId: string,
    subtopicId: string
  ): Promise<any> {
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Course not found');

    const topic = course.topics.find((t) => t.id === topicId);
    if (!topic) throw new Error('Topic not found');

    if (!topic.subtopics || topic.subtopics.length === 0) {
      throw new Error('Subtopics not found for this topic');
    }

    const subtopic = topic.subtopics.find((s) => s.id === subtopicId);
    if (!subtopic) throw new Error('Subtopic not found');
    if (subtopic.status === 'complete') return subtopic;

    const prompt = generateSubtopicContentPrompt(topic.title, subtopic.title);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    const cleanedText = text.replace(/```json\n?|\n?```/g, '');
    const parsedContent = JSON.parse(cleanedText);

    subtopic.content = parsedContent.content;
    subtopic.status = 'complete';

    await course.save();
    return subtopic;
  }

  /**
   * Generates content for all incomplete subtopics of a topic.
   * @param courseId - The ID of the course.
   * @param topicId - The ID of the topic.
   * @returns The updated topic with completed subtopics.
   */
  async generateTopicContent(courseId: string, topicId: string): Promise<any> {
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Course not found');

    const topic = course.topics.find((t) => t.id === topicId);
    if (!topic) throw new Error('Topic not found');

    if (!topic.subtopics || topic.subtopics.length === 0) {
      throw new Error('Subtopics not found for this topic');
    }

    if (topic.status === 'complete') return topic;

    await Promise.allSettled(
      topic.subtopics.map(async (subtopic) => {
        if (subtopic.status === 'incomplete') {
          const prompt = generateSubtopicContentPrompt(
            topic.title,
            subtopic.title
          );
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = await response.text();
          const parsedContent = await this.parseGeneratedContent(text);

          subtopic.content = parsedContent.content || 'Content not available.';
          subtopic.status = 'complete';
        }
      })
    );

    if (topic.subtopics.every((s) => s.status === 'complete')) {
      topic.status = 'complete';
    }

    await course.save();
    return topic;
  }

  /**
   * Parses and cleans AI-generated content.
   * @param rawText - The raw text generated by the model.
   * @returns Parsed and cleaned JSON content.
   */
  async parseGeneratedContent(rawText: string): Promise<any> {
    const cleanedText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedText);
  }

  /**
   * Handles subtopics with failed content generation.
   * @param courseId - The ID of the course.
   * @param topicId - The ID of the topic.
   * @returns The updated topic with retried subtopics.
   */
  async handleFailedSubtopics(courseId: string, topicId: string): Promise<any> {
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Course not found');

    const topic = course.topics.find((t) => t.id === topicId);
    if (!topic) throw new Error('Topic not found');

    if (!topic.subtopics || topic.subtopics.length === 0) {
      throw new Error('Subtopics not found for this topic');
    }

    const failedSubtopics = topic.subtopics.filter(
      (sub) =>
        sub.content ===
        'Content generation failed due to invalid response format.'
    );

    if (failedSubtopics.length === 0) {
      return topic; // No failed subtopics, return the topic as is
    }

    await Promise.all(
      failedSubtopics.map(async (subtopic) => {
        const prompt = generateSubtopicContentPrompt(
          topic.title,
          subtopic.title
        );
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        const parsedContent = await this.parseGeneratedContent(text);

        subtopic.content =
          parsedContent.content || 'Content generation failed.';
        subtopic.status = 'complete';
      })
    );

    await course.save();
    return topic;
  }
}

export default new GeminiService();
