import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createCourse, updateCourse } from '@/lib/api/courses';
import { Course } from '@/lib/types/course';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const courseSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['image_theory', 'video_theory']),
  accessibility: z.enum(['free', 'paid', 'limited']),
  numTopics: z.number().min(1).max(20),
  subtopics: z.array(z.string()).optional(),
});

interface CreateCourseDialogProps {
  course?: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateCourseDialog({
  course,
  open,
  onOpenChange,
  onSuccess,
}: CreateCourseDialogProps) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'image_theory' as const,
      accessibility: 'free' as const,
      numTopics: 5,
      subtopics: [],
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        description: course.description,
        type: course.type,
        accessibility: course.accessibility,
        numTopics: course.topics.length,
        subtopics: course.topics.flatMap(topic => 
          topic.subtopics?.map(subtopic => subtopic.title) || []
        ),
      });
    } else {
      form.reset({
        title: '',
        description: '',
        type: 'image_theory',
        accessibility: 'free',
        numTopics: 5,
        subtopics: [],
      });
    }
  }, [course, form]);

  const onSubmit = async (data: z.infer<typeof courseSchema>) => {
    try {
      if (course) {
        await updateCourse(course.id, data);
        toast({
          title: 'Success',
          description: 'Course updated successfully',
        });
      } else {
        await createCourse(data);
        toast({
          title: 'Success',
          description: 'Course created successfully',
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save course',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {course ? 'Edit Course' : 'Create Course'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter course title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter course description"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="image_theory" id="image_theory" />
                          <Label htmlFor="image_theory">Image & Theory</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="video_theory" id="video_theory" />
                          <Label htmlFor="video_theory">Video & Theory</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accessibility</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select accessibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="limited">Limited Free</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="numTopics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Topics</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      className="flex space-x-4"
                    >
                      {[5, 10, 15, 20].map((num) => (
                        <div key={num} className="flex items-center space-x-2">
                          <RadioGroupItem value={num.toString()} id={`topics_${num}`} />
                          <Label htmlFor={`topics_${num}`}>{num}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {course ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
