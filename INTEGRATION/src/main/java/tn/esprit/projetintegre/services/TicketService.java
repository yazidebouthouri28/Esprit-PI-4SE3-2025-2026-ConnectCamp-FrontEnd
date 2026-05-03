package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Event;
import tn.esprit.projetintegre.entities.Ticket;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.TicketStatus;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.EventRepository;
import tn.esprit.projetintegre.repositories.TicketRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Page<Ticket> getTicketsByUser(Long userId, Pageable pageable) {
        return ticketRepository.findByUserId(userId, pageable);
    }

    public Page<Ticket> getTicketsByEvent(Long eventId, Pageable pageable) {
        return ticketRepository.findByEventId(eventId, pageable);
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
    }

    public Ticket getTicketByNumber(String ticketNumber) {
        return ticketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
    }

    public long getAvailableTicketCount(Long eventId) {
        return ticketRepository.countByEventIdAndStatus(eventId, TicketStatus.AVAILABLE);
    }

    @Transactional
    public Ticket purchaseTicket(Long userId, Long eventId, String ticketType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        // Check if event has capacity
        if (event.getMaxParticipants() != null && 
            event.getCurrentParticipants() >= event.getMaxParticipants()) {
            throw new IllegalStateException("Event is sold out");
        }

        Ticket ticket = Ticket.builder()
                .event(event)
                .user(user)
                .ticketType(ticketType != null ? ticketType : "STANDARD")
                .price(event.getPrice())
                .status(TicketStatus.SOLD)
                .qrCode(generateQRCode())
                .barcode(generateBarcode())
                .purchasedAt(LocalDateTime.now())
                .expiresAt(event.getEndDate())
                .isTransferable(true)
                .isRefundable(true)
                .build();

        ticket = ticketRepository.save(ticket);

        // Update event participant count
        event.setCurrentParticipants(event.getCurrentParticipants() + 1);
        eventRepository.save(event);

        return ticket;
    }

    @Transactional
    public Ticket useTicket(String ticketNumber) {
        Ticket ticket = getTicketByNumber(ticketNumber);
        
        if (ticket.getStatus() != TicketStatus.SOLD) {
            throw new IllegalStateException("Ticket is not valid for use");
        }
        
        if (ticket.getExpiresAt() != null && ticket.getExpiresAt().isBefore(LocalDateTime.now())) {
            ticket.setStatus(TicketStatus.EXPIRED);
            ticketRepository.save(ticket);
            throw new IllegalStateException("Ticket has expired");
        }

        ticket.setStatus(TicketStatus.USED);
        ticket.setUsedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket cancelTicket(Long ticketId) {
        Ticket ticket = getTicketById(ticketId);
        
        if (!ticket.getIsRefundable()) {
            throw new IllegalStateException("Ticket is not refundable");
        }
        
        ticket.setStatus(TicketStatus.CANCELLED);

        // Update event participant count
        Event event = ticket.getEvent();
        event.setCurrentParticipants(event.getCurrentParticipants() - 1);
        eventRepository.save(event);

        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket transferTicket(Long ticketId, Long newUserId) {
        Ticket ticket = getTicketById(ticketId);
        
        if (!ticket.getIsTransferable()) {
            throw new IllegalStateException("Ticket is not transferable");
        }
        
        User newUser = userRepository.findById(newUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        ticket.setUser(newUser);
        return ticketRepository.save(ticket);
    }

    private String generateQRCode() {
        return "QR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateBarcode() {
        return "BC" + System.currentTimeMillis();
    }
}
