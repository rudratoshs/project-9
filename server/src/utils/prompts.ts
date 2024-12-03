import { CreateCourseData } from '../types/course';

export function generateCoursePrompt(
  data: CreateCourseData,
  topicIndex: number
): string {
  const isCurrentTopic = topicIndex === 0;

  return `
      Generate the structure for one topic in the course titled "${data.title}".
      The course description is: "${data.description}".
      Course type: "${data.type}".
      This is topic ${topicIndex + 1} of ${data.numTopics}.
      
      Format the response as a JSON object using this structure:
      {
        "topic": {
          "title": "Topic Title",
          "subtopics": [
            {
              "title": "Subtopic Title",
              ${
                isCurrentTopic
                  ? '"theory": "Detailed content explaining the subtopic, including examples.",'
                  : '"theory": "",'
              }
              "youtube": "",
              "image": "",
              "done": ${isCurrentTopic ? 'true' : 'false'}
            }
          ]
        }
      }
  
      Requirements:
      - Generate a topic relevant to the course description.
      - Include subtopics that are logically related to this topic.
      - ${
        isCurrentTopic
          ? 'Provide detailed content in the "theory" field for each subtopic, including relevant examples.'
          : 'Leave the "theory" field empty for subtopics.'
      }
      - Ensure the explanations are concise, clear, and educational.
      - Keep the "youtube" and "image" fields empty.
      - Set the "done" field to ${
        isCurrentTopic ? 'true' : 'false'
      } for all subtopics.
  
      ${
        data.subtopics?.length
          ? `Additional Requirement:
      - Include references to these subtopics if relevant: ${data.subtopics
        .map((subtopic) => `"${subtopic}"`)
        .join(', ')}.`
          : ''
      }
    `.trim();
}

export function generatePreviewPrompt(data: CreateCourseData): string {
  const subtopicsList = data.subtopics?.length
    ? data.subtopics.join(', ')
    : 'none';

  return `
      Generate a preview with ${
        data.numTopics
      } unique topics, each containing subtopics related to the course "${
    data.title
  }".
      The course is about: ${data.description}.
      
      Format the response as a JSON object with this structure:
      {
        "${data.title.toLowerCase()}": [
          {
            "title": "Sample Topic Title",
            "subtopics": [
              {
                "title": "Sample Subtopic Title",
                "theory": "",
                "youtube": "",
                "image": "",
                "done": false
              }
            ]
          }
        ]
      }

      Requirements:
      - Generate ${
        data.numTopics
      } unique topics relevant to the course description.
      - Each topic should contain diverse subtopics relevant to the topic itself.
      - Include the following subtopics somewhere across all topics: ${subtopicsList}.
      - Keep all media fields (theory, youtube, image) empty.
      - Ensure the content structure is suitable for the ${data.type} format.
      - Set "done" to false for all subtopics.
    `;
}

export function generateSubtopicDetailsPrompt(
  mainTopic: string,
  subTopic: string
): string {
  return `
      Explain the subtopic "${subTopic}" in the context of the main topic "${mainTopic}".
      Provide detailed explanations, including practical examples and key points.
      Do not include additional resources or images in the response.
      
      Format the response as plain text.
    `.trim();
}

export function generateSubtopicContentPrompt(
  mainTopic: string,
  subTopic: string
): string {
  return `
      Explain the subtopic "${subTopic}" in detail within the context of the main topic "${mainTopic}".
      Include:
      - Clear and concise definitions.
      - Practical examples or use cases.
      - Logical explanations that build on the main topic.
      
      Format the response as JSON:
      {
        "title": "${subTopic}",
        "content": "Generated detailed explanation for the subtopic."
      }
      
      Requirements:
      - The explanation must be educational and easy to understand.
      - Avoid adding links, images, or unrelated content.
    `.trim();
}

export function generateTextPromptForImage(
  topic: string,
  courseTitle: string
): string {
  return `
      Generate a visual description for the topic '${topic}' within the course '${courseTitle}'.
      The description should be concise, engaging, and highlight the key visual elements that reflect the topic. 
      Format the response in 150 characters or fewer.
  `.trim();
}

