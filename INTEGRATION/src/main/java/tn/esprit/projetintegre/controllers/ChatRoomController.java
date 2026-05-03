package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.ChatRoomDTO;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.services.ChatRoomService;

@RestController
@RequestMapping("/api/chat-rooms")
@RequiredArgsConstructor
@Tag(name = "Salons de Discussion", description = "API pour la gestion des salons de discussion")
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    @PostMapping
    @Operation(summary = "Créer un salon de discussion")
    public ResponseEntity<ApiResponse<ChatRoomDTO.Response>> createRoom(
            @RequestParam Long creatorId,
            @Valid @RequestBody ChatRoomDTO.CreateRequest request) {
        ChatRoomDTO.Response response = chatRoomService.createRoom(creatorId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Salon créé avec succès", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un salon par ID")
    public ResponseEntity<ApiResponse<ChatRoomDTO.Response>> getById(@PathVariable Long id) {
        ChatRoomDTO.Response response = chatRoomService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Obtenir les salons d'un utilisateur")
    public ResponseEntity<ApiResponse<PageResponse<ChatRoomDTO.Response>>> getByMemberId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lastMessageAt").descending());
        var result = chatRoomService.getByMemberId(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/public")
    @Operation(summary = "Obtenir les salons publics")
    public ResponseEntity<ApiResponse<PageResponse<ChatRoomDTO.Response>>> getPublicRooms(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var result = chatRoomService.getPublicRooms(pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des salons publics")
    public ResponseEntity<ApiResponse<PageResponse<ChatRoomDTO.Response>>> searchRooms(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var result = chatRoomService.searchRooms(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un salon")
    public ResponseEntity<ApiResponse<ChatRoomDTO.Response>> updateRoom(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody ChatRoomDTO.UpdateRequest request) {
        ChatRoomDTO.Response response = chatRoomService.updateRoom(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Salon mis à jour avec succès", response));
    }

    @PostMapping("/{roomId}/members")
    @Operation(summary = "Ajouter un membre au salon")
    public ResponseEntity<ApiResponse<Void>> addMember(
            @PathVariable Long roomId,
            @RequestParam Long adminId,
            @RequestParam Long userId) {
        chatRoomService.addMember(roomId, adminId, userId);
        return ResponseEntity.ok(ApiResponse.success("Membre ajouté avec succès", null));
    }

    @DeleteMapping("/{roomId}/members/{userId}")
    @Operation(summary = "Retirer un membre du salon")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long roomId,
            @PathVariable Long userId,
            @RequestParam Long adminId) {
        chatRoomService.removeMember(roomId, adminId, userId);
        return ResponseEntity.ok(ApiResponse.success("Membre retiré avec succès", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un salon")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @PathVariable Long id,
            @RequestParam Long userId) {
        chatRoomService.deleteRoom(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Salon supprimé avec succès", null));
    }
}
