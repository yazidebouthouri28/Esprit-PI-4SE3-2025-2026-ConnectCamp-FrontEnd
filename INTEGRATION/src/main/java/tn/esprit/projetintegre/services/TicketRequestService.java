package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.TicketRequestDTO;
import tn.esprit.projetintegre.entities.Event;
import tn.esprit.projetintegre.entities.TicketRequest;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.TicketRequestStatus;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.exception.BusinessException;
import tn.esprit.projetintegre.repositories.EventRepository;
import tn.esprit.projetintegre.repositories.TicketRequestRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketRequestService {

    private final TicketRequestRepository ticketRequestRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public TicketRequestDTO.Response createRequest(Long userId, TicketRequestDTO.CreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'ID: " + userId));

        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Événement non trouvé avec l'ID: " + request.getEventId()));

        // Vérifier si l'événement est actif
        if (event.getStatus() != tn.esprit.projetintegre.enums.EventStatus.PUBLISHED) {
            throw new BusinessException("L'événement n'est pas disponible pour les demandes de billets");
        }

        // Vérifier si l'utilisateur a déjà une demande en attente pour cet événement
        var existingRequests = ticketRequestRepository.findByUserIdAndEventId(userId, request.getEventId());
        boolean hasPendingRequest = existingRequests.stream()
                .anyMatch(r -> r.getStatus() == TicketRequestStatus.PENDING);
        if (hasPendingRequest) {
            throw new BusinessException("Vous avez déjà une demande en attente pour cet événement");
        }

        TicketRequest ticketRequest = TicketRequest.builder()
                .quantity(request.getQuantity())
                .message(request.getMessage())
                .ticketType(request.getTicketType())
                .status(TicketRequestStatus.PENDING)
                .user(user)
                .event(event)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        // Calculer le prix total si l'événement a un prix
        if (event.getPrice() != null) {
            ticketRequest.setTotalPrice(event.getPrice().multiply(java.math.BigDecimal.valueOf(request.getQuantity())));
        }

        ticketRequest = ticketRequestRepository.save(ticketRequest);
        return toResponse(ticketRequest);
    }

    @Transactional(readOnly = true)
    public TicketRequestDTO.Response getById(Long id) {
        TicketRequest request = ticketRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande de billet non trouvée avec l'ID: " + id));
        return toResponse(request);
    }

    @Transactional(readOnly = true)
    public TicketRequestDTO.Response getByRequestNumber(String requestNumber) {
        TicketRequest request = ticketRequestRepository.findByRequestNumber(requestNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Demande de billet non trouvée avec le numéro: " + requestNumber));
        return toResponse(request);
    }

    @Transactional(readOnly = true)
    public Page<TicketRequestDTO.Response> getByUserId(Long userId, Pageable pageable) {
        return ticketRequestRepository.findByUserId(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TicketRequestDTO.Response> getByEventId(Long eventId, Pageable pageable) {
        return ticketRequestRepository.findByEventId(eventId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TicketRequestDTO.Response> getByStatus(TicketRequestStatus status, Pageable pageable) {
        return ticketRequestRepository.findByStatus(status, pageable).map(this::toResponse);
    }

    public TicketRequestDTO.Response updateRequest(Long id, TicketRequestDTO.UpdateRequest request) {
        TicketRequest ticketRequest = ticketRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande de billet non trouvée avec l'ID: " + id));

        if (ticketRequest.getStatus() != TicketRequestStatus.PENDING) {
            throw new BusinessException("Seules les demandes en attente peuvent être modifiées");
        }

        if (request.getQuantity() != null) {
            ticketRequest.setQuantity(request.getQuantity());
            if (ticketRequest.getEvent().getPrice() != null) {
                ticketRequest.setTotalPrice(ticketRequest.getEvent().getPrice()
                        .multiply(java.math.BigDecimal.valueOf(request.getQuantity())));
            }
        }
        if (request.getMessage() != null) {
            ticketRequest.setMessage(request.getMessage());
        }
        if (request.getTicketType() != null) {
            ticketRequest.setTicketType(request.getTicketType());
        }

        ticketRequest = ticketRequestRepository.save(ticketRequest);
        return toResponse(ticketRequest);
    }

    public TicketRequestDTO.Response processRequest(Long id, Long processedById, TicketRequestDTO.ProcessRequest request) {
        TicketRequest ticketRequest = ticketRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande de billet non trouvée avec l'ID: " + id));

        if (ticketRequest.getStatus() != TicketRequestStatus.PENDING) {
            throw new BusinessException("Cette demande a déjà été traitée");
        }

        User processedBy = userRepository.findById(processedById)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'ID: " + processedById));

        ticketRequest.setStatus(request.getStatus());
        ticketRequest.setResponseMessage(request.getResponseMessage());
        ticketRequest.setAdminNotes(request.getAdminNotes());
        ticketRequest.setProcessedAt(LocalDateTime.now());
        ticketRequest.setProcessedBy(processedBy);

        ticketRequest = ticketRequestRepository.save(ticketRequest);
        return toResponse(ticketRequest);
    }

    public TicketRequestDTO.Response cancelRequest(Long id, Long userId) {
        TicketRequest ticketRequest = ticketRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande de billet non trouvée avec l'ID: " + id));

        if (!ticketRequest.getUser().getId().equals(userId)) {
            throw new BusinessException("Vous n'êtes pas autorisé à annuler cette demande");
        }

        if (ticketRequest.getStatus() != TicketRequestStatus.PENDING) {
            throw new BusinessException("Seules les demandes en attente peuvent être annulées");
        }

        ticketRequest.setStatus(TicketRequestStatus.CANCELLED);
        ticketRequest = ticketRequestRepository.save(ticketRequest);
        return toResponse(ticketRequest);
    }

    public void deleteRequest(Long id) {
        if (!ticketRequestRepository.existsById(id)) {
            throw new ResourceNotFoundException("Demande de billet non trouvée avec l'ID: " + id);
        }
        ticketRequestRepository.deleteById(id);
    }

    private TicketRequestDTO.Response toResponse(TicketRequest request) {
        return TicketRequestDTO.Response.builder()
                .id(request.getId())
                .requestNumber(request.getRequestNumber())
                .quantity(request.getQuantity())
                .status(request.getStatus())
                .message(request.getMessage())
                .responseMessage(request.getResponseMessage())
                .ticketType(request.getTicketType())
                .totalPrice(request.getTotalPrice())
                .requestedAt(request.getRequestedAt())
                .processedAt(request.getProcessedAt())
                .expiresAt(request.getExpiresAt())
                .userId(request.getUser().getId())
                .userName(request.getUser().getName())
                .eventId(request.getEvent().getId())
                .eventTitle(request.getEvent().getTitle())
                .processedById(request.getProcessedBy() != null ? request.getProcessedBy().getId() : null)
                .processedByName(request.getProcessedBy() != null ? request.getProcessedBy().getName() : null)
                .createdAt(request.getCreatedAt())
                .build();
    }
}
