package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.AvailabilityStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TimeSlotResponse {
    private Long id;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer capacity;
    private Integer bookedCount;
    private Integer availableSlots;
    private AvailabilityStatus status;
    private String notes;
    private Long eventId;
    private String eventName;
    private Long serviceId;
    private String serviceName;
    private LocalDateTime createdAt;
}
