package tn.esprit.projetintegre.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.ChatRoomType;

import java.time.LocalDateTime;
import java.util.List;

public class ChatRoomDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "Le nom du salon est obligatoire")
        @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
        private String name;

        @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
        private String description;

        private String image;

        @NotNull(message = "Le type de salon est obligatoire")
        private ChatRoomType type;

        private Long relatedEntityId;
        private String relatedEntityType;

        @Min(value = 2, message = "Le nombre maximum de membres doit être au moins 2")
        @Max(value = 1000, message = "Le nombre maximum de membres ne peut pas dépasser 1000")
        private Integer maxMembers = 100;

        private Boolean isPublic = false;
        private Boolean allowJoin = true;

        private List<Long> memberIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
        private String name;

        @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
        private String description;

        private String image;
        private Integer maxMembers;
        private Boolean isPublic;
        private Boolean allowJoin;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private String image;
        private ChatRoomType type;
        private Long relatedEntityId;
        private String relatedEntityType;
        private Integer maxMembers;
        private Boolean isPublic;
        private Boolean allowJoin;
        private Boolean isActive;
        private String lastMessageContent;
        private LocalDateTime lastMessageAt;
        private Long creatorId;
        private String creatorName;
        private Integer memberCount;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberAction {
        @NotNull(message = "L'ID de l'utilisateur est obligatoire")
        private Long userId;
    }
}
