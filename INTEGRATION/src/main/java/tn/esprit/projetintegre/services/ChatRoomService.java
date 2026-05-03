package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.ChatRoomDTO;
import tn.esprit.projetintegre.entities.ChatRoom;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.ChatRoomType;
import tn.esprit.projetintegre.exception.BusinessException;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.ChatRoomRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;

    public ChatRoomDTO.Response createRoom(Long creatorId, ChatRoomDTO.CreateRequest request) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'ID: " + creatorId));

        ChatRoom chatRoom = ChatRoom.builder()
                .name(request.getName())
                .description(request.getDescription())
                .image(request.getImage())
                .type(request.getType())
                .relatedEntityId(request.getRelatedEntityId())
                .relatedEntityType(request.getRelatedEntityType())
                .maxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 100)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .allowJoin(request.getAllowJoin() != null ? request.getAllowJoin() : true)
                .isActive(true)
                .creator(creator)
                .members(new ArrayList<>())
                .admins(new ArrayList<>())
                .build();

        chatRoom.getMembers().add(creator);
        chatRoom.getAdmins().add(creator);

        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            List<User> members = userRepository.findAllById(request.getMemberIds());
            chatRoom.getMembers().addAll(members);
        }

        chatRoom = chatRoomRepository.save(chatRoom);
        return toResponse(chatRoom);
    }

    @Transactional(readOnly = true)
    public ChatRoomDTO.Response getById(Long id) {
        ChatRoom room = chatRoomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salon non trouvé avec l'ID: " + id));
        return toResponse(room);
    }

    @Transactional(readOnly = true)
    public Page<ChatRoomDTO.Response> getByMemberId(Long userId, Pageable pageable) {
        return chatRoomRepository.findByMemberId(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ChatRoomDTO.Response> getPublicRooms(Pageable pageable) {
        return chatRoomRepository.findByIsPublicTrueAndIsActiveTrue(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ChatRoomDTO.Response> searchRooms(String keyword, Pageable pageable) {
        return chatRoomRepository.searchPublicRooms(keyword, pageable).map(this::toResponse);
    }

    public ChatRoomDTO.Response updateRoom(Long id, Long userId, ChatRoomDTO.UpdateRequest request) {
        ChatRoom room = chatRoomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salon non trouvé avec l'ID: " + id));

        if (!isAdmin(room, userId)) {
            throw new BusinessException("Vous n'êtes pas autorisé à modifier ce salon");
        }

        if (request.getName() != null) room.setName(request.getName());
        if (request.getDescription() != null) room.setDescription(request.getDescription());
        if (request.getImage() != null) room.setImage(request.getImage());
        if (request.getMaxMembers() != null) room.setMaxMembers(request.getMaxMembers());
        if (request.getIsPublic() != null) room.setIsPublic(request.getIsPublic());
        if (request.getAllowJoin() != null) room.setAllowJoin(request.getAllowJoin());

        room = chatRoomRepository.save(room);
        return toResponse(room);
    }

    public void addMember(Long roomId, Long adminId, Long userId) {
        ChatRoom room = chatRoomRepository.findByIdWithMembers(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Salon non trouvé avec l'ID: " + roomId));

        if (!isAdmin(room, adminId) && !room.getAllowJoin()) {
            throw new BusinessException("Vous n'êtes pas autorisé à ajouter des membres");
        }

        if (room.getMembers().size() >= room.getMaxMembers()) {
            throw new BusinessException("Le salon a atteint sa capacité maximale");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'ID: " + userId));

        if (room.getMembers().stream().anyMatch(m -> m.getId().equals(userId))) {
            throw new BusinessException("L'utilisateur est déjà membre de ce salon");
        }

        room.getMembers().add(user);
        chatRoomRepository.save(room);
    }

    public void removeMember(Long roomId, Long adminId, Long userId) {
        ChatRoom room = chatRoomRepository.findByIdWithMembers(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Salon non trouvé avec l'ID: " + roomId));

        if (!isAdmin(room, adminId) && !adminId.equals(userId)) {
            throw new BusinessException("Vous n'êtes pas autorisé à retirer des membres");
        }

        if (room.getCreator().getId().equals(userId)) {
            throw new BusinessException("Le créateur ne peut pas être retiré du salon");
        }

        room.getMembers().removeIf(m -> m.getId().equals(userId));
        room.getAdmins().removeIf(a -> a.getId().equals(userId));
        chatRoomRepository.save(room);
    }

    public void deleteRoom(Long id, Long userId) {
        ChatRoom room = chatRoomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salon non trouvé avec l'ID: " + id));

        if (!room.getCreator().getId().equals(userId)) {
            throw new BusinessException("Seul le créateur peut supprimer ce salon");
        }

        chatRoomRepository.delete(room);
    }

    private boolean isAdmin(ChatRoom room, Long userId) {
        return room.getAdmins().stream().anyMatch(a -> a.getId().equals(userId));
    }

    private ChatRoomDTO.Response toResponse(ChatRoom room) {
        return ChatRoomDTO.Response.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .image(room.getImage())
                .type(room.getType())
                .relatedEntityId(room.getRelatedEntityId())
                .relatedEntityType(room.getRelatedEntityType())
                .maxMembers(room.getMaxMembers())
                .isPublic(room.getIsPublic())
                .allowJoin(room.getAllowJoin())
                .isActive(room.getIsActive())
                .lastMessageContent(room.getLastMessageContent())
                .lastMessageAt(room.getLastMessageAt())
                .creatorId(room.getCreator().getId())
                .creatorName(room.getCreator().getName())
                .memberCount(room.getMembers() != null ? room.getMembers().size() : 0)
                .createdAt(room.getCreatedAt())
                .build();
    }
}
