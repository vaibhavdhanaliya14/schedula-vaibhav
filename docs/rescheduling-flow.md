# Appointment Rescheduling Flow

```mermaid
flowchart TD
  A[Patient opens existing appointment] --> B[Patient chooses new slot or wave]
  B --> C{Is appointment cancelled?}
  C -- YES --> Z[Reject reschedule]
  C -- NO --> D{Is it within 30-minute cutoff?}
  D -- YES --> Y[Reject with cutoff message]
  D -- NO --> E{Requested slot/wave exists?}
  E -- NO --> F[Suggest next available appointment]
  E -- YES --> G{Is slot available or wave not full?}
  G -- NO --> F
  G -- YES --> H[Release old booking]
  H --> I[Reserve new slot]
  I --> J[Update appointment time and status]
  J --> K[Return updated appointment details]
```

## Rescheduling rules

1. Only the appointment owner can reschedule.
2. Cancelled appointments cannot be rescheduled.
3. Past appointments cannot be rescheduled.
4. Appointments within 30 minutes of start time cannot be rescheduled or cancelled.
5. For stream scheduling, the requested slot must exist and be free.
6. For wave scheduling, the target wave must exist and have capacity.
7. If the requested slot is unavailable, return the next suggested available time instead of failing silently.
