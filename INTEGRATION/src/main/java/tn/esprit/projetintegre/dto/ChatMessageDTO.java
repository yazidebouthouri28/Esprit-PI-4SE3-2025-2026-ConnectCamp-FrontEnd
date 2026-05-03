package tn.esprit.projetintegre.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.MessageType;

import java.time.LocalDateTime;

public class ChatMessageDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "L'ID du salon est obligatoire")
        private Long chatRoomId;

        @NotBlank(message = "Le contenu du message est obligatoire")
        @Size(max = 5000, message = "Le message ne peut pas dépasser 5000 caractères")
        private String content;

        private MessageType type = MessageType.TEXT;
        private String attachmentUrl;
        private String attachmentName;
        private Long attachmentSize;
        private Long replyToId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @NotBlank(message = "Le contenu du message est obligatoire")
        @Size(max = 5000, message = "Le message ne peut pas dépasser 5000 caractères")
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String content;
        private MessageType type;
        private String attachmentUrl;
        private String attachmentName;
        private Long attachmentSize;
        private Boolean isEdited;
        private Boolean isDeleted;
        private Boolean isRead;
        private LocalDateTime editedAt;
        private LocalDateTime readAt;
        private Long chatRoomId;
        private Long senderId;
        private String senderName;
        private String senderAvatar;
        private Long replyToId;
        private String replyToContent;
        private LocalDateTime createdAt;
    }
}
