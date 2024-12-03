import { PrismaClient } from '@prisma/client';
import Course, { ICourse } from '../models/mongodb/Course';
import { CreateCourseData, UpdateCourseData } from '../types/course';
import prisma from '../config/prisma';
import geminiService from './gemini.service';

export class CourseService {
  /**
   * Creates a new course with topics, storing it in MongoDB and referencing it in MySQL.
   * @param userId - ID of the user creating the course.
   * @param data - Data for creating the course.
   * @returns The created course document.
   */
  async createCourse(userId: string, data: CreateCourseData): Promise<ICourse> {
    let mongoCourse: ICourse | null = null;

    try {
      const topics: any[] = [];
      for (let i = 0; i < data.numTopics; i++) {
        const generatedTopic = await geminiService.generateCourseContent(
          data,
          i
        );
        topics.push(generatedTopic);
      }

      mongoCourse = await Course.create({
        title: data.title,
        description: data.description,
        type: data.type,
        accessibility: data.accessibility,
        topics,
      });

      if (!mongoCourse._id) {
        throw new Error('MongoDB Course creation failed: Missing _id');
      }

      await prisma.course.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type,
          accessibility: data.accessibility,
          userId: userId,
          mongoId: mongoCourse._id.toString(),
        },
      });

      return mongoCourse;
    } catch (error) {
      if (mongoCourse) {
        try {
          await Course.findByIdAndDelete(mongoCourse._id);
        } catch {}
      }
      throw error;
    }
  }

  /**
   * Retrieves all courses for a specific user.
   * @param userId - ID of the user.
   * @returns List of user's courses.
   */
  async getUserCourses(userId: string): Promise<ICourse[]> {
    const userCourses = await prisma.course.findMany({
      where: { userId },
      select: { mongoId: true },
    });

    const mongoIds = userCourses.map((course) => course.mongoId);
    return Course.find({ _id: { $in: mongoIds } });
  }

  /**
   * Retrieves a course by its ID.
   * @param courseId - ID of the course.
   * @returns The course document or null if not found.
   */
  async getCourseById(courseId: string): Promise<ICourse | null> {
    return Course.findById(courseId);
  }

  /**
   * Updates a course's information in MongoDB and MySQL.
   * @param courseId - ID of the course to update.
   * @param data - Updated course data.
   * @returns The updated course document or null if not found.
   */
  async updateCourse(
    courseId: string,
    data: UpdateCourseData
  ): Promise<ICourse | null> {
    const course = await Course.findByIdAndUpdate(courseId, data, {
      new: true,
    });

    if (course) {
      await prisma.course.update({
        where: { mongoId: courseId },
        data: {
          title: data.title,
          description: data.description,
          type: data.type,
          accessibility: data.accessibility,
        },
      });
    }

    return course;
  }

  /**
   * Deletes a course from MongoDB and removes its reference from MySQL.
   * @param userId - ID of the user deleting the course.
   * @param courseId - ID of the course to delete.
   */
  async deleteCourse(userId: string, courseId: string): Promise<void> {
    await Course.findByIdAndDelete(courseId);
    await prisma.course.delete({
      where: {
        mongoId: courseId,
        userId: userId,
      },
    });
  }

  /**
   * Generates a preview of the course content.
   * @param data - Data for previewing the course.
   * @returns Previewed course content.
   */
  async previewCourse(data: CreateCourseData) {
    return geminiService.generatePreview(data);
  }

  /**
   * Generates and updates the content for a specific topic in a course.
   * @param courseId - ID of the course containing the topic.
   * @param topicId - ID of the topic to generate content for.
   * @returns The updated topic.
   */
  async generateTopicContent(courseId: string, topicId: string): Promise<any> {
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Course not found');

    const topic = course.topics.find((t) => t.id === topicId);
    if (!topic) throw new Error('Topic not found');

    const incompleteSubtopics =
      topic.subtopics?.filter((s) => s.status === 'incomplete') || [];
    if (incompleteSubtopics.length === 0) {
      topic.status = 'complete';
      await course.save();
      return topic;
    }

    const generatedContent = await geminiService.generateTopicContent(
      courseId,
      topicId
    );
    if (!generatedContent || !generatedContent.subtopics) {
      throw new Error('Failed to generate content for subtopics');
    }
    const subtopics = topic.subtopics ?? [];

    generatedContent.subtopics.forEach((generatedSubtopic: any) => {
      const subtopic = subtopics.find(
        (s) => String(s.id) === String(generatedSubtopic.id)
      );
      if (subtopic) {
        subtopic.status = generatedSubtopic.status;
        subtopic.content = generatedSubtopic.content;
      }
    });

    course.markModified('topics');
    console.log('generatedContent', generatedContent);
    console.log('subtopics', subtopics);
    if (subtopics.some((s) => s.status === 'incomplete')) {
      throw new Error('Some subtopics were not updated correctly.');
    }

    if (subtopics.every((s) => s.status === 'complete')) {
      topic.status = 'complete';
    }

    await course.save();
    return topic;
  }
}

export default new CourseService();
