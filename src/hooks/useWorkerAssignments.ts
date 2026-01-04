import { useState, useCallback } from 'react';
import { WorkerAssignment } from '@/types/gps';

const STORAGE_KEY = 'worker-assignments';

const DEFAULT_ASSIGNMENTS: WorkerAssignment[] = [
  {
    id: '1',
    workerId: '2', // Jane Worker from demo
    fenceId: '1',
    jobLabel: 'Crane Operator',
  },
];

interface UseWorkerAssignmentsReturn {
  assignments: WorkerAssignment[];
  assignWorker: (assignment: Omit<WorkerAssignment, 'id'>) => void;
  unassignWorker: (workerId: string) => void;
  getWorkerAssignment: (workerId: string) => WorkerAssignment | undefined;
}

export const useWorkerAssignments = (): UseWorkerAssignmentsReturn => {
  const [assignments, setAssignments] = useState<WorkerAssignment[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_ASSIGNMENTS;
  });

  const saveAssignments = (newAssignments: WorkerAssignment[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAssignments));
    setAssignments(newAssignments);
  };

  const assignWorker = useCallback((assignment: Omit<WorkerAssignment, 'id'>) => {
    // Remove existing assignment for this worker
    const filtered = assignments.filter(a => a.workerId !== assignment.workerId);
    const newAssignment: WorkerAssignment = {
      ...assignment,
      id: Date.now().toString(),
    };
    saveAssignments([...filtered, newAssignment]);
  }, [assignments]);

  const unassignWorker = useCallback((workerId: string) => {
    saveAssignments(assignments.filter(a => a.workerId !== workerId));
  }, [assignments]);

  const getWorkerAssignment = useCallback((workerId: string) => {
    return assignments.find(a => a.workerId === workerId);
  }, [assignments]);

  return { assignments, assignWorker, unassignWorker, getWorkerAssignment };
};
