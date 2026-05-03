package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ParticipantRequest {
    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String name;
    
    @Email(message = "L'email doit être valide")
    @NotBlank(message = "L'email est obligatoire")
    private String email;
    
    private String phone;
    private String notes;
    private String specialNeeds;
    
    @NotNull(message = "L'ID de l'événement est obligatoire")
    private Long eventId;
    
    private Long userId;
    private Long ticketId;
}
