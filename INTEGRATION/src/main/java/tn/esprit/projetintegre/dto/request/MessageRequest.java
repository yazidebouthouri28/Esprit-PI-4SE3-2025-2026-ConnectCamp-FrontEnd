package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.projetintegre.enums.MessageType;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageRequest {
    @NotBlank(message = "Le contenu est obligatoire")
    private String content;
    
    private MessageType messageType = MessageType.TEXT;
    private String mediaUrl;
    private String fileName;
    private Long fileSize;
    
    @NotNull(message = "L'ID de l'expéditeur est obligatoire")
    private Long senderId;
    
    private Long receiverId;
    private Long chatRoomId;
    private Long replyToId;
}
