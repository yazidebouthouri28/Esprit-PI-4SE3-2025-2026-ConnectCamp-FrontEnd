package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.MessageType;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageResponse {
    private Long id;
    private String content;
    private MessageType messageType;
    private String mediaUrl;
    private String thumbnailUrl;
    private String fileType;
    private String fileName;
    private Long fileSize;
    private Boolean isRead;
    private LocalDateTime readAt;
    private Boolean isEdited;
    private LocalDateTime editedAt;
    private Boolean isDeleted;
    private LocalDateTime sentAt;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private Long receiverId;
    private String receiverName;
    private Long chatRoomId;
    private Long replyToId;
    private List<MessageReactionResponse> reactions;
    private LocalDateTime createdAt;
}
