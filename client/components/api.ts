export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const multipart = body instanceof FormData;
  const res = await fetch("/api" + url, {
    method,
    credentials: "include",
    headers: {
      "x-studiospace": "1",
      ...(!multipart && body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.message || "Request failed", res.status);
  return data;
}
export type User = {
  professionalTitle?: string;
  bio?: string;
  phone?: string;
  website?: string;
  portfolio?: string;
  bookingPreference?: string;
  crewPreference?: string;
  createdAt?: string;
  _id: string;
  name: string;
  email: string;
  photoURL: string;
};
export type Studio = {
  status?: "active" | "paused";
  specs?: {
    usableArea?: number;
    gridHeight?: number;
    powerSupply?: string;
    soundproofRating?: string;
    access?: string;
    parking?: string;
  };
  rules?: string[];
  updatedAt?: string;
  ownerEmail?: string;
  _id: string;
  title: string;
  category: string;
  city: string;
  country: string;
  address: string;
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  images: string[];
  amenities: string[];
  overview: string;
  ownerId: string;
  ownerName: string;
  averageRating: number;
  reviewCount: number;
};
export type Booking = {
  totalHours?: number;
  hourlyRateSnapshot?: number;
  securityDeposit?: number;
  createdAt?: string;
  _id: string;
  studioId: Studio;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  userEmail: string;
};
export const categories = [
  "Photo Studios",
  "Film Stages",
  "Podcast Rooms",
  "Music Suites",
  "Art Workshops",
];
