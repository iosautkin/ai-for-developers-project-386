import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Calendar API" })
@info(#{ version: "1.0.0" })
namespace Calendar.Api;

/** Infrastructure response used to verify the contract and runtime pipeline. */
model HealthResponse {
  status: "ok";
}

/** Stable machine-readable API error codes. */
enum ApiErrorCode {
  validationError: "VALIDATION_ERROR",
  meetingTypeNotFound: "MEETING_TYPE_NOT_FOUND",
  duplicateMeetingType: "DUPLICATE_MEETING_TYPE",
  dateOutsideBookingWindow: "DATE_OUTSIDE_BOOKING_WINDOW",
  slotConflict: "SLOT_CONFLICT",
  internalError: "INTERNAL_ERROR",
}

/** Validation failure for one request field. */
model FieldError {
  field: string;
  message: string;
}

/** Common response body for every unsuccessful API operation. */
model ApiError {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: FieldError[];
}

@error
model BadRequestErrorResponse {
  @statusCode statusCode: 400;
  @body body: ApiError;
}

@error
model NotFoundErrorResponse {
  @statusCode statusCode: 404;
  @body body: ApiError;
}

@error
model ConflictErrorResponse {
  @statusCode statusCode: 409;
  @body body: ApiError;
}

@error
model InternalErrorResponse {
  @statusCode statusCode: 500;
  @body body: ApiError;
}

/** Identifier of a meeting type, supplied by the calendar owner. */
@minLength(3)
@maxLength(64)
@pattern("^[a-z0-9]+(?:-[a-z0-9]+)*$")
scalar MeetingTypeId extends string;

/** RFC 3339 UTC instant serialized with the canonical Z suffix. */
@format("date-time")
@pattern("Z$")
scalar UtcInstant extends string;

/** Supported meeting duration in minutes. Every value is a multiple of 15. */
enum MeetingDurationMinutes {
  minutes15: 15,
  minutes30: 30,
  minutes45: 45,
  minutes60: 60,
  minutes75: 75,
  minutes90: 90,
  minutes105: 105,
  minutes120: 120,
  minutes135: 135,
  minutes150: 150,
  minutes165: 165,
  minutes180: 180,
  minutes195: 195,
  minutes210: 210,
  minutes225: 225,
  minutes240: 240,
  minutes255: 255,
  minutes270: 270,
  minutes285: 285,
  minutes300: 300,
  minutes315: 315,
  minutes330: 330,
  minutes345: 345,
  minutes360: 360,
  minutes375: 375,
  minutes390: 390,
  minutes405: 405,
  minutes420: 420,
  minutes435: 435,
  minutes450: 450,
  minutes465: 465,
  minutes480: 480,
  minutes495: 495,
  minutes510: 510,
  minutes525: 525,
  minutes540: 540,
}

/** The single configured calendar owner. */
model OwnerSummary {
  id: string;

  @minLength(1)
  @maxLength(100)
  displayName: string;
}

/** Meeting type published by the calendar owner. */
model MeetingType {
  id: MeetingTypeId;
  owner: OwnerSummary;

  @minLength(1)
  @maxLength(100)
  title: string;

  @minLength(1)
  @maxLength(500)
  description: string;

  durationMinutes: MeetingDurationMinutes;
}

/** Meeting type fields embedded into booking responses. */
model MeetingTypeSummary {
  id: MeetingTypeId;

  @minLength(1)
  @maxLength(100)
  title: string;
  durationMinutes: MeetingDurationMinutes;
}

/** Input normalized and persisted by the backend when a meeting type is created. */
model CreateMeetingTypeRequest {
  id: MeetingTypeId;

  @minLength(1)
  @maxLength(100)
  title: string;

  @minLength(1)
  @maxLength(500)
  description: string;

  durationMinutes: MeetingDurationMinutes;
}

/** Guest details stored as a snapshot inside a booking. */
model GuestDetails {
  @minLength(1)
  @maxLength(100)
  name: string;

  @format("email")
  @maxLength(254)
  email: string;

  @maxLength(1000)
  note?: string;
}

/** Input for an atomic booking attempt. The backend computes the end time. */
model CreateBookingRequest {
  meetingTypeId: MeetingTypeId;
  startsAt: UtcInstant;
  guest: GuestDetails;
}

/** Persisted booking returned to the guest and calendar owner. */
model Booking {
  id: string;
  owner: OwnerSummary;
  meetingType: MeetingTypeSummary;
  startsAt: UtcInstant;
  endsAt: UtcInstant;
  guest: GuestDetails;
}

/** Whether a future slot may be selected. Occupied slots never reveal booking details. */
enum SlotStatus {
  available: "available",
  occupied: "occupied",
}

/** One backend-computed slot in UTC. */
model AvailabilitySlot {
  startsAt: UtcInstant;
  endsAt: UtcInstant;
  status: SlotStatus;
}

/** Why a date cannot currently accept a booking. */
enum UnbookableDateReason {
  weekend: "WEEKEND",
  noSlots: "NO_SLOTS",
  past: "PAST",
}

/** One Moscow calendar date and its backend-computed slots. */
model DateAvailability {
  date: plainDate;
  bookable: boolean;
  reason?: UnbookableDateReason;
  slots: AvailabilitySlot[];
}

/** Self-contained availability snapshot for the current 14-day Moscow booking window. */
model AvailabilityResponse {
  meetingType: MeetingTypeSummary;
  generatedAt: UtcInstant;
  windowStartsOn: plainDate;
  windowEndsOn: plainDate;
  timeZone: "Europe/Moscow";
  @minItems(14)
  @maxItems(14)
  dates: DateAvailability[];
}

model CreatedMeetingTypeResponse {
  @statusCode statusCode: 201;
  @body body: MeetingType;
}

model CreatedBookingResponse {
  @statusCode statusCode: 201;
  @body body: Booking;
}

/** Reports whether the HTTP process and its SQLite dependency are ready. */
@route("/api/health")
@get
op getHealth(): HealthResponse | InternalErrorResponse;

/** Lists all meeting types in backend-defined creation order. */
@route("/api/meeting-types")
@get
op listMeetingTypes(): MeetingType[] | InternalErrorResponse;

/** Returns one meeting type so a direct booking URL can load independently. */
@route("/api/meeting-types/{meetingTypeId}")
@get
op getMeetingType(
  @path meetingTypeId: MeetingTypeId,
): MeetingType | BadRequestErrorResponse | NotFoundErrorResponse | InternalErrorResponse;

/** Creates a meeting type for the configured owner. */
@route("/api/meeting-types")
@post
op createMeetingType(
  @body request: CreateMeetingTypeRequest,
): CreatedMeetingTypeResponse | BadRequestErrorResponse | ConflictErrorResponse | InternalErrorResponse;

/** Returns all dates and slots in the current 14-day Moscow booking window. */
@route("/api/meeting-types/{meetingTypeId}/availability")
@get
op getMeetingTypeAvailability(
  @path meetingTypeId: MeetingTypeId,
): AvailabilityResponse | BadRequestErrorResponse | NotFoundErrorResponse | InternalErrorResponse;

/** Atomically validates and creates a booking. */
@route("/api/bookings")
@post
op createBooking(
  @body request: CreateBookingRequest,
): CreatedBookingResponse
  | BadRequestErrorResponse
  | NotFoundErrorResponse
  | ConflictErrorResponse
  | InternalErrorResponse;

/** Lists bookings whose start time is strictly later than the backend clock. */
@route("/api/bookings/upcoming")
@get
op listUpcomingBookings(): Booking[] | InternalErrorResponse;
