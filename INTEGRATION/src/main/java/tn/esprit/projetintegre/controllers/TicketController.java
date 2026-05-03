package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.dto.response.TicketResponse;
import tn.esprit.projetintegre.entities.Ticket;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.TicketService;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Ticket management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class TicketController {

    private final TicketService ticketService;
    private final DtoMapper dtoMapper;

    @GetMapping
    @Operation(summary = "Get all tickets")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAllTickets() {
        List<Ticket> tickets = ticketService.getAllTickets();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toTicketResponseList(tickets)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get tickets by user")
    public ResponseEntity<ApiResponse<PageResponse<TicketResponse>>> getTicketsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Ticket> tickets = ticketService.getTicketsByUser(userId, PageRequest.of(page, size));
        Page<TicketResponse> response = tickets.map(dtoMapper::toTicketResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/event/{eventId}")
    @Operation(summary = "Get tickets by event")
    public ResponseEntity<ApiResponse<PageResponse<TicketResponse>>> getTicketsByEvent(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Ticket> tickets = ticketService.getTicketsByEvent(eventId, PageRequest.of(page, size));
        Page<TicketResponse> response = tickets.map(dtoMapper::toTicketResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get ticket by ID")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicketById(@PathVariable Long id) {
        Ticket ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toTicketResponse(ticket)));
    }

    @GetMapping("/number/{ticketNumber}")
    @Operation(summary = "Get ticket by number")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicketByNumber(@PathVariable String ticketNumber) {
        Ticket ticket = ticketService.getTicketByNumber(ticketNumber);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toTicketResponse(ticket)));
    }

    @GetMapping("/event/{eventId}/available")
    @Operation(summary = "Get available ticket count for event")
    public ResponseEntity<ApiResponse<Long>> getAvailableTicketCount(@PathVariable Long eventId) {
        long count = ticketService.getAvailableTicketCount(eventId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PostMapping("/purchase")
    @Operation(summary = "Purchase a ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> purchaseTicket(
            @RequestParam Long userId,
            @RequestParam Long eventId,
            @RequestParam(required = false) String ticketType) {
        Ticket ticket = ticketService.purchaseTicket(userId, eventId, ticketType);
        return ResponseEntity.ok(ApiResponse.success("Ticket purchased successfully", dtoMapper.toTicketResponse(ticket)));
    }

    @PostMapping("/use/{ticketNumber}")
    @Operation(summary = "Use/Validate a ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> useTicket(@PathVariable String ticketNumber) {
        Ticket ticket = ticketService.useTicket(ticketNumber);
        return ResponseEntity.ok(ApiResponse.success("Ticket validated successfully", dtoMapper.toTicketResponse(ticket)));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> cancelTicket(@PathVariable Long id) {
        Ticket ticket = ticketService.cancelTicket(id);
        return ResponseEntity.ok(ApiResponse.success("Ticket cancelled successfully", dtoMapper.toTicketResponse(ticket)));
    }

    @PostMapping("/{id}/transfer")
    @Operation(summary = "Transfer a ticket to another user")
    public ResponseEntity<ApiResponse<TicketResponse>> transferTicket(
            @PathVariable Long id,
            @RequestParam Long newUserId) {
        Ticket ticket = ticketService.transferTicket(id, newUserId);
        return ResponseEntity.ok(ApiResponse.success("Ticket transferred successfully", dtoMapper.toTicketResponse(ticket)));
    }
}
