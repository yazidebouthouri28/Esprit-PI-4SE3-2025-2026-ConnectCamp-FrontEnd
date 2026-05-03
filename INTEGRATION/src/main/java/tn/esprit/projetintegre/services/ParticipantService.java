package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.request.ParticipantRequest;
import tn.esprit.projetintegre.dto.response.ParticipantResponse;
import tn.esprit.projetintegre.entities.*;
import tn.esprit.projetintegre.enums.TicketStatus;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ParticipantService {

    private final ParticipantRepository participantRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;

    public List<ParticipantResponse> getAll() {
        return participantRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<ParticipantResponse> getByEventId(Long eventId, Pageable pageable) {
        return participantRepository.findByEventId(eventId, pageable).map(this::toResponse);
    }

    public ParticipantResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public ParticipantResponse create(ParticipantRequest request) {
        Participant participant = new Participant();
        participant.setName(request.getName());
        participant.setEmail(request.getEmail());
        participant.setPhone(request.getPhone());
        participant.setNotes(request.getNotes());
        participant.setSpecialNeeds(request.getSpecialNeeds());
        participant.setStatus(TicketStatus.RESERVED);
        participant.setCheckedIn(false);
        
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Événement", "id", request.getEventId()));
        participant.setEvent(event);
        
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", request.getUserId()));
            participant.setUser(user);
        }
        
        if (request.getTicketId() != null) {
            Ticket ticket = ticketRepository.findById(request.getTicketId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", request.getTicketId()));
            participant.setTicket(ticket);
        }
        
        return toResponse(participantRepository.save(participant));
    }

    public ParticipantResponse update(Long id, ParticipantRequest request) {
        Participant participant = findById(id);
        participant.setName(request.getName());
        participant.setEmail(request.getEmail());
        participant.setPhone(request.getPhone());
        participant.setNotes(request.getNotes());
        participant.setSpecialNeeds(request.getSpecialNeeds());
        
        return toResponse(participantRepository.save(participant));
    }

    public ParticipantResponse checkIn(Long id) {
        Participant participant = findById(id);
        participant.setCheckedIn(true);
        participant.setCheckedInAt(LocalDateTime.now());
        participant.setStatus(TicketStatus.USED);
        return toResponse(participantRepository.save(participant));
    }

    public void delete(Long id) {
        if (!participantRepository.existsById(id)) {
            throw new ResourceNotFoundException("Participant", "id", id);
        }
        participantRepository.deleteById(id);
    }

    public long countByEventId(Long eventId) {
        return participantRepository.countByEventId(eventId);
    }

    public long countCheckedInByEventId(Long eventId) {
        return participantRepository.countByEventIdAndCheckedIn(eventId, true);
    }

    private Participant findById(Long id) {
        return participantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "id", id));
    }

    private ParticipantResponse toResponse(Participant p) {
        return ParticipantResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .email(p.getEmail())
                .phone(p.getPhone())
                .status(p.getStatus())
                .checkedIn(p.getCheckedIn())
                .checkedInAt(p.getCheckedInAt())
                .notes(p.getNotes())
                .specialNeeds(p.getSpecialNeeds())
                .eventId(p.getEvent().getId())
                .eventName(p.getEvent().getTitle())
                .userId(p.getUser() != null ? p.getUser().getId() : null)
                .userName(p.getUser() != null ? p.getUser().getName() : null)
                .ticketId(p.getTicket() != null ? p.getTicket().getId() : null)
                .ticketNumber(p.getTicket() != null ? p.getTicket().getTicketNumber() : null)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
