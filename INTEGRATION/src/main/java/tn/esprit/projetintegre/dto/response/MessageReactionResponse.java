package tn.esprit.projetintegre.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageReactionResponse {
    private Long id;
    private String emoji;
    private Long userId;
    private String userName;
    private LocalDateTime createdAt;
}
