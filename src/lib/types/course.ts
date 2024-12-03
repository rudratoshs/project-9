export interface Course {
    id: string;
    title: string;
    description: string;
    type: 'image_theory' | 'video_theory';
    accessibility: 'free' | 'paid' | 'limited';
    topics: Topic[];
    createdAt: string;
    updatedAt: string;
    userId: string;
  }
  
  export interface Topic {
    id: string;
    title: string;
    content: string;
    order: number;
    subtopics?: Subtopic[];
  }
  
  export interface Subtopic {
    id: string;
    title: string;
    content: string;
    order: number;
  }
  
  export interface CreateCourseData {
    title: string;
    description: string;
    type: 'image_theory' | 'video_theory';
    accessibility: 'free' | 'paid' | 'limited';
    numTopics: number;
    subtopics?: string[];
  }
  
  export interface UpdateCourseData {
    title?: string;
    description?: string;
    type?: 'image_theory' | 'video_theory';
    accessibility?: 'free' | 'paid' | 'limited';
    topics?: Topic[];
  }