import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  type: 'image_theory' | 'video_theory';
  accessibility: 'free' | 'paid' | 'limited';
  topics: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
    status: 'incomplete' | 'complete'; // Added status field
    subtopics?: Array<{
      id: string;
      title: string;
      content: string;
      order: number;
      status: 'incomplete' | 'complete'; // Added status field
    }>;
  }>;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['image_theory', 'video_theory'],
      required: true,
    },
    accessibility: {
      type: String,
      enum: ['free', 'paid', 'limited'],
      required: true,
    },
    topics: [
      {
        id: {
          type: String,
          default: () => new mongoose.Types.ObjectId().toString(),
        }, // Generate unique ID
        title: { type: String },
        content: { type: String },
        order: { type: Number },
        status: {
          type: String,
          enum: ['incomplete', 'complete'],
          default: 'incomplete',
        }, // Default status
        subtopics: [
          {
            id: {
              type: String,
              default: () => new mongoose.Types.ObjectId().toString(),
            }, // Generate unique ID
            title: { type: String },
            content: { type: String },
            order: { type: Number },
            status: {
              type: String,
              enum: ['incomplete', 'complete'],
              default: 'incomplete',
            }, // Default status
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Course = mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
