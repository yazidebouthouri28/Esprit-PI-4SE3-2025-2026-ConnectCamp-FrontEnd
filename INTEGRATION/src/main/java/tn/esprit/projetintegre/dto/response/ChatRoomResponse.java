package tn.esprit.projetintegre.dto.response;

import lombok.*;
import tn.esprit.projetintegre.enums.ChatRoomType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomResponse {
    private Long id;
    private String name;
    private String description;
    private ChatRoomType type;
    private String avatar;
    private Boolean isActive;
    private Long creatorId;
    private String creatorName;
    private List<Long> participantIds;
    private Integer participantCount;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
}
