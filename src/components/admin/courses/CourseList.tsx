import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download, Search, BookOpen, Filter } from 'lucide-react';
import { Course } from '@/lib/types/course';
import { getCourses } from '@/lib/api/courses';
import CourseTable from './CourseTable';
import CreateCourseDialog from './CreateCourseDialog';

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch courses',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    let result = courses;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        course =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedType) {
      result = result.filter(course => course.type === selectedType);
    }

    // Apply accessibility filter
    if (selectedAccessibility) {
      result = result.filter(course => course.accessibility === selectedAccessibility);
    }

    setFilteredCourses(result);
  }, [searchTerm, selectedType, selectedAccessibility, courses]);

  const exportCourses = () => {
    const headers = ['Title', 'Type', 'Accessibility', 'Topics', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredCourses.map(course =>
        [
          course.title,
          course.type,
          course.accessibility,
          course.topics.length,
          new Date(course.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'courses.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
          <p className="text-muted-foreground">
            Total Courses: {filteredCourses.length}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={exportCourses}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Create Course
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedType || "all"}
                onValueChange={(value) => setSelectedType(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image_theory">Image & Theory</SelectItem>
                  <SelectItem value="video_theory">Video & Theory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedAccessibility || "all"}
                onValueChange={(value) => setSelectedAccessibility(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by accessibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access Types</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="limited">Limited Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <CourseTable
            courses={filteredCourses}
            onCourseChange={fetchCourses}
            loading={loading}
          />
        </CardContent>
      </Card>

      <CreateCourseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchCourses}
      />
    </div>
  );
}