package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TimeSlotRequest {
    @NotNull(message = "La date est obligatoire")
    private LocalDate date;
    
    @NotNull(message = "L'heure de début est obligatoire")
    private LocalTime startTime;
    
    @NotNull(message = "L'heure de fin est obligatoire")
    private LocalTime endTime;
    
    @Min(value = 1, message = "La capacité doit être au moins 1")
    private Integer capacity = 1;
    
    private String notes;
    private Long eventId;
    private Long serviceId;
}
