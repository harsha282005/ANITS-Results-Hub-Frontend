
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { getStudentPerformanceForFacultyView } from "@/services/api";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const academicYears = ["--", "A21", "A22", "A23", "A24", "A25"];
const semesters = ["--", "1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];
const departments = ["--", "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "CSM"];

const processDataForVerticalTable = (data: any[] | null) => {
  if (!data || data.length === 0) {
    return { headers: [], rows: [] };
  }

  const uniqueSections = [...new Set(data.map(d => d.section).filter(Boolean))];
  const metrics: { [key: string]: { [section: string]: string } } = {};

  const allKeys = new Set<string>();
  data.forEach(sectionData => {
    Object.keys(sectionData).forEach(key => {
      if (key !== 'section') {
        allKeys.add(key);
      }
    });
  });

  const sortedKeys = Array.from(allKeys).sort();

  const finalMetricOrder = sortedKeys;
  
  finalMetricOrder.forEach(metricName => {
    metrics[metricName] = {};
  });

  data.forEach(sectionData => {
    const sectionName = sectionData.section;
    if (!sectionName) return;

    finalMetricOrder.forEach(metricKey => {
       metrics[metricKey][sectionName] = sectionData[metricKey] ?? '--';
    });
  });

  return {
    headers: ["Metric", ...uniqueSections],
    rows: finalMetricOrder.map(metric => ({
      metric,
      ...metrics[metric]
    }))
  };
};

export default function FacultyPerformanceViewPage() {
  const [selectedBatch, setSelectedBatch] = useState("--");
  const [selectedSemester, setSelectedSemester] = useState("--");
  const [selectedDepartment, setSelectedDepartment] = useState("--");
  const [performanceData, setPerformanceData] = useState<any[] | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (selectedBatch !== '--' && selectedSemester !== '--' && selectedDepartment !== '--') {
        setIsLoading(true);
        setError(null);
        setPerformanceData(undefined);
        try {
          const data = await getStudentPerformanceForFacultyView(selectedBatch, selectedSemester, selectedDepartment);
          setPerformanceData(data);
        } catch (err: any) {
          setError(err.message || "Failed to fetch performance data.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setPerformanceData(undefined);
      }
    };
    fetchPerformanceData();
  }, [selectedBatch, selectedSemester, selectedDepartment]);

  const { headers, rows } = useMemo(() => processDataForVerticalTable(performanceData), [performanceData]);
  
  const hasFilters = selectedBatch !== '--' && selectedSemester !== '--' && selectedDepartment !== '--';

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Faculty Performance View</h1>
        <p className="text-muted-foreground">
          View faculty performance by applying filters.
        </p>
      </div>
      <div className="flex justify-center items-center gap-6 flex-wrap">
          <div className="grid gap-2">
              <Label htmlFor="year-select">Academic Year</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger id="year-select" className="w-[180px]">
                      <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                      {academicYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
          <div className="grid gap-2">
              <Label htmlFor="semester-select">Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger id="semester-select" className="w-[180px]">
                      <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                        {semesters.map(sem => (
                          <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
          <div className="grid gap-2">
              <Label htmlFor="department-select">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger id="department-select" className="w-[180px]">
                      <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                        {departments.map(dep => (
                          <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
      </div>
      
       {isLoading ? (
        <div className="flex justify-center items-center h-40">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
            <CardContent className="p-10 text-center text-destructive flex flex-col items-center gap-4">
                <AlertTriangle className="h-8 w-8" />
                <p className="font-semibold">Error loading data</p>
                <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
        </Card>
      ) : performanceData && performanceData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Section Data</CardTitle>
            <CardDescription>A breakdown of performance metrics for each section.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                      <TableRow>
                      {headers.map(header => (
                          <TableHead key={header}>{header}</TableHead>
                      ))}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {rows.map((row, index) => (
                      <TableRow key={row.metric}>
                          <TableCell className="font-medium">{row.metric}</TableCell>
                          {headers.slice(1).map(sectionName => (
                              <TableCell key={sectionName}>{row[sectionName] ?? '--'}</TableCell>
                          ))}
                      </TableRow>
                      ))}
                  </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
                <p>
                  {hasFilters && performanceData === null 
                    ? "Data not available for the selected criteria."
                    : "Please select all filters to view faculty performance data."
                  }
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
