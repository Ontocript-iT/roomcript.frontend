import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { url } from 'inspector/promises';

export interface Room {
  id: number;
  roomNumber: string;
  roomType: string;
  status: string;
}

export interface CreateTaskRequest {
  roomId: number;
  taskType: string;
  priority: string;
  scheduledTime: string;
  notes: string;
  specialInstructions: string;
  estimatedDuration: number;
  roomConditionBefore: string;
  requiresInspection: boolean;
  isCheckoutCleaning: boolean;
  assignedToId: number | null;
  reservationId: number | null;
}

export interface HousekeepingTask {
  id: number;
  taskNumber: string;
  propertyCode: string;
  roomId: number;
  roomNumber: string;
  roomType: string;
  taskType: string;
  priority: string;
  status: string;
  assignedToId: number | null;
  assignedToName: string | null;
  scheduledTime: string;
  notes: string | null;
  estimatedDuration: number;
  roomConditionBefore: string;
  isCheckoutCleaning: boolean;
  createdAt: string;
}
export interface TaskResponse {
  result: HousekeepingTask[];
  message: string;
  status: number;
}

export interface LostFoundItem {
  id: number;
  itemNumber: string;
  propertyCode: string;
  roomId: number;
  roomNumber: string;
  foundById: number;
  foundByName: string;
  foundDate: string;
  itemDescription: string;
  category: string;
  status: string;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  storageLocation: string;
  notes: string;
  imageUrl: string;
  isFragile: boolean;
  isValuable: boolean;
  disposeAfterDate: string;
  reservationConfirmationNumber: string | null;
}

export interface LostFoundResponse {
  result: LostFoundItem[];
  message: string;
  status: number;
}

@Injectable({
  providedIn: 'root',
})
export class HousekeepingService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const propertyCode = localStorage.getItem('propertyCode') || 'PROP0005'; // Fallback or dynamic
    return new HttpHeaders().set('X-Property-Code', propertyCode);
  }

  // Fetch Rooms
  getAllRooms(): Observable<Room[]> {
    return this.http
      .get<any>(`${this.apiUrl}/rooms`, {
        headers: this.getHeaders(),
      })
      .pipe(
        // The API returns the list inside a "body" property based on your JSON
        map((response) => response.body || [])
      );
  }

  // Create Task
  createTask(taskData: CreateTaskRequest, propertyCode: string): Observable<any> {
    const params = new HttpParams().set('propertyCode', propertyCode);

    return this.http.post(`${this.apiUrl}/housekeeping/tasks`, taskData, {
      headers: this.getHeaders(),
      params: params,
    });
  }

  getAllTasks(propertyCode: string): Observable<TaskResponse> {
    const params = new HttpParams().set('propertyCode', propertyCode);
    return this.http.get<TaskResponse>(`${this.apiUrl}/housekeeping/tasks`, { params });
  }

  getTasks(propertyCode: string, status: string = 'ALL'): Observable<TaskResponse> {
    let url = this.apiUrl;
    const params = new HttpParams().set('propertyCode', propertyCode);

    if (status && status !== 'ALL') {
      url = `${this.apiUrl}/housekeeping/tasks/status/${status}`;
    }
    return this.http.get<TaskResponse>(url, { params });
  }

  getAllLostAndFound(propertyCode: string): Observable<LostFoundResponse> {
    const params = new HttpParams().set('propertyCode', propertyCode);
    return this.http.get<LostFoundResponse>(`${this.apiUrl}/housekeeping/lost-and-found`, { params });
  }

  // Get Unclaimed Items specifically
  getUnclaimedItems(propertyCode: string): Observable<LostFoundResponse> {
    const params = new HttpParams().set('propertyCode', propertyCode);
    return this.http.get<LostFoundResponse>(`${this.apiUrl}/housekeeping/lost-and-found/unclaimed`, { params });
  }

  // Dispose Item
  // Assuming DELETE method based on standard practices for removal, 
  // but if your API uses POST/PUT, change the method below accordingly.
  disposeItem(id: number, reason: string): Observable<any> {
    const params = new HttpParams().set('reason', reason);
    return this.http.delete<any>(`${this.apiUrl}/housekeeping/lost-and-found/${id}`, { params });
  }
}
