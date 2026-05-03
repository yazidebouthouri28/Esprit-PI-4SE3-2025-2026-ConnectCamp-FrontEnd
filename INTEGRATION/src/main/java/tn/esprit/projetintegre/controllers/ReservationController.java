package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.dto.response.ReservationResponse;
import tn.esprit.projetintegre.entities.Reservation;
import tn.esprit.projetintegre.enums.PaymentStatus;
import tn.esprit.projetintegre.enums.ReservationStatus;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.ReservationService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservations", description = "Reservation management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class ReservationController {

    private final ReservationService reservationService;
    private final DtoMapper dtoMapper;

    @GetMapping
    @Operation(summary = "Get all reservations")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getAllReservations() {
        List<Reservation> reservations = reservationService.getAllReservations();
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toReservationResponseList(reservations)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get reservations by user")
    public ResponseEntity<ApiResponse<PageResponse<ReservationResponse>>> getReservationsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Reservation> reservations = reservationService.getReservationsByUser(userId, PageRequest.of(page, size));
        Page<ReservationResponse> response = reservations.map(dtoMapper::toReservationResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/site/{siteId}")
    @Operation(summary = "Get reservations by site")
    public ResponseEntity<ApiResponse<PageResponse<ReservationResponse>>> getReservationsBySite(
            @PathVariable Long siteId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Reservation> reservations = reservationService.getReservationsBySite(siteId, PageRequest.of(page, size));
        Page<ReservationResponse> response = reservations.map(dtoMapper::toReservationResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get reservation by ID")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservationById(@PathVariable Long id) {
        Reservation reservation = reservationService.getReservationById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toReservationResponse(reservation)));
    }

    @GetMapping("/number/{reservationNumber}")
    @Operation(summary = "Get reservation by number")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservationByNumber(@PathVariable String reservationNumber) {
        Reservation reservation = reservationService.getReservationByNumber(reservationNumber);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toReservationResponse(reservation)));
    }

    @PostMapping("/site")
    @Operation(summary = "Create site reservation")
    public ResponseEntity<ApiResponse<ReservationResponse>> createSiteReservation(
            @RequestParam Long userId,
            @RequestParam Long siteId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkOut,
            @RequestParam int numberOfGuests,
            @RequestParam String guestName,
            @RequestParam String guestEmail,
            @RequestParam String guestPhone,
            @RequestParam(required = false) String specialRequests) {
        Reservation reservation = reservationService.createSiteReservation(userId, siteId, checkIn, checkOut,
                numberOfGuests, guestName, guestEmail, guestPhone, specialRequests);
        return ResponseEntity.ok(ApiResponse.success("Reservation created successfully", dtoMapper.toReservationResponse(reservation)));
    }

    @PostMapping("/event")
    @Operation(summary = "Create event reservation")
    public ResponseEntity<ApiResponse<ReservationResponse>> createEventReservation(
            @RequestParam Long userId,
            @RequestParam Long eventId,
            @RequestParam String guestName,
            @RequestParam String guestEmail,
            @RequestParam String guestPhone) {
        Reservation reservation = reservationService.createEventReservation(userId, eventId,
                guestName, guestEmail, guestPhone);
        return ResponseEntity.ok(ApiResponse.success("Reservation created successfully", dtoMapper.toReservationResponse(reservation)));
    }

    @PatchMapping("/{id}/confirm")
    @Operation(summary = "Confirm reservation")
    public ResponseEntity<ApiResponse<ReservationResponse>> confirmReservation(@PathVariable Long id) {
        Reservation reservation = reservationService.confirmReservation(id);
        return ResponseEntity.ok(ApiResponse.success("Reservation confirmed", dtoMapper.toReservationResponse(reservation)));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel reservation")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancelReservation(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        Reservation reservation = reservationService.cancelReservation(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Reservation cancelled", dtoMapper.toReservationResponse(reservation)));
    }

    @PatchMapping("/{id}/payment")
    @Operation(summary = "Update payment status")
    public ResponseEntity<ApiResponse<ReservationResponse>> updatePaymentStatus(
            @PathVariable Long id,
            @RequestParam PaymentStatus status,
            @RequestParam(required = false) String transactionId) {
        Reservation reservation = reservationService.updatePaymentStatus(id, status, transactionId);
        return ResponseEntity.ok(ApiResponse.success("Payment status updated", dtoMapper.toReservationResponse(reservation)));
    }
}
