import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { CreateCourseData, UpdateCourseData } from '../types/course';

export class CourseController {
  private courseService: CourseService;

  constructor() {
    this.courseService = new CourseService();
  }

  async createCourse(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data: CreateCourseData = req.body;
      const course = await this.courseService.createCourse(userId, data);
      res.status(201).json(course);
    } catch (error) {
      console.error('Create course error:', error);
      res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Failed to create course',
      });
    }
  }

  async previewCourse(req: Request, res: Response) {
    try {
      const data: CreateCourseData = req.body;
      const preview = await this.courseService.previewCourse(data);
      res.json(preview);
    } catch (error) {
      console.error('Preview course error:', error);
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate course preview',
      });
    }
  }

  async getUserCourses(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const courses = await this.courseService.getUserCourses(userId);
      res.json(courses);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : 'Failed to fetch courses',
      });
    }
  }

  async getCourseById(req: Request, res: Response) {
    try {
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : 'Failed to fetch course',
      });
    }
  }

  async updateCourse(req: Request, res: Response) {
    try {
      const data: UpdateCourseData = req.body;
      const course = await this.courseService.updateCourse(req.params.id, data);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      res.json(course);
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Failed to update course',
      });
    }
  }

  async deleteCourse(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      await this.courseService.deleteCourse(userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : 'Failed to delete course',
      });
    }
  }

  async generateTopicContent(req: Request, res: Response) {
    try {
      const { courseId, topicId } = req.params;
      const topic = await this.courseService.generateTopicContent(
        courseId,
        topicId
      );
      res.json(topic);
    } catch (error) {
      console.error('Generate topic content error:', error);
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate topic content',
      });
    }
  }
}

export default new CourseController();
