package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.EmergencyAlertDTO;
import tn.esprit.projetintegre.entities.EmergencyAlert;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.entities.Event;
import tn.esprit.projetintegre.enums.AlertStatus;
import tn.esprit.projetintegre.enums.EmergencyType;
import tn.esprit.projetintegre.enums.EmergencySeverity;
import tn.esprit.projetintegre.exception.BusinessException;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.EmergencyAlertRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.repositories.EventRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EmergencyAlertService {

    private final EmergencyAlertRepository alertRepository;
    private final UserRepository userRepository;
    private final SiteRepository siteRepository;
    private final EventRepository eventRepository;

    public EmergencyAlertDTO.Response createAlert(Long reporterId, EmergencyAlertDTO.CreateRequest request) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'ID: " + reporterId));

        EmergencyAlert alert = EmergencyAlert.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .emergencyType(request.getEmergencyType())
                .severity(request.getSeverity())
                .status(AlertStatus.ACTIVE)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .location(request.getLocation())
                .instructions(request.getInstructions())
                .emergencyContacts(request.getEmergencyContacts())
                .affectedPersonsCount(request.getAffectedPersonsCount())
                .evacuationRequired(request.getEvacuationRequired() != null ? request.getEvacuationRequired() : false)
                .reportedBy(reporter)
                .build();

        if (request.getSiteId() != null) {
            Site site = siteRepository.findById(request.getSiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Site non trouvé avec l'ID: " + request.getSiteId()));
            alert.setSite(site);
        }

        if (request.getEventId() != null) {
            Event event = eventRepository.findById(request.getEventId())
                    .orElseThrow(() -> new ResourceNotFoundException("Événement non trouvé avec l'ID: " + request.getEventId()));
            alert.setEvent(event);
        }

        alert = alertRepository.save(alert);
        return toResponse(alert);
    }

    @Transactional(readOnly = true)
    public EmergencyAlertDTO.Response getById(Long id) {
        EmergencyAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alerte non trouvée avec l'ID: " + id));
        return toResponse(alert);
    }

    @Transactional(readOnly = true)
    public List<EmergencyAlertDTO.Response> getActiveAlerts() {
        return alertRepository.findActiveAlerts().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<EmergencyAlertDTO.Response> getCriticalAlerts() {
        return alertRepository.findCriticalActiveAlerts().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<EmergencyAlertDTO.Response> getBySiteId(Long siteId, Pageable pageable) {
        return alertRepository.findBySiteId(siteId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<EmergencyAlertDTO.Response> getByStatus(AlertStatus status, Pageable pageable) {
        return alertRepository.findByStatus(status, pageable).map(this::toResponse);
    }

    public EmergencyAlertDTO.Response acknowledgeAlert(Long id, Long userId) {
        EmergencyAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alerte non trouvée avec l'ID: " + id));

        if (alert.getStatus() != AlertStatus.ACTIVE) {
            throw new BusinessException("Seules les alertes actives peuvent être acquittées");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'ID: " + userId));

        alert.setStatus(AlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedAt(LocalDateTime.now());
        alert.setAcknowledgedBy(user);

        alert = alertRepository.save(alert);
        return toResponse(alert);
    }

    public EmergencyAlertDTO.Response resolveAlert(Long id, Long userId, String resolutionNotes) {
        EmergencyAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alerte non trouvée avec l'ID: " + id));

        if (alert.getStatus() == AlertStatus.RESOLVED) {
            throw new BusinessException("Cette alerte est déjà résolue");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'ID: " + userId));

        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());
        alert.setResolvedBy(user);
        alert.setResolutionNotes(resolutionNotes);

        alert = alertRepository.save(alert);
        return toResponse(alert);
    }

    public EmergencyAlertDTO.Response updateAlert(Long id, EmergencyAlertDTO.UpdateRequest request) {
        EmergencyAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alerte non trouvée avec l'ID: " + id));

        if (request.getTitle() != null) alert.setTitle(request.getTitle());
        if (request.getDescription() != null) alert.setDescription(request.getDescription());
        if (request.getSeverity() != null) alert.setSeverity(request.getSeverity());
        if (request.getStatus() != null) alert.setStatus(request.getStatus());
        if (request.getLocation() != null) alert.setLocation(request.getLocation());
        if (request.getInstructions() != null) alert.setInstructions(request.getInstructions());
        if (request.getEmergencyContacts() != null) alert.setEmergencyContacts(request.getEmergencyContacts());
        if (request.getAffectedPersonsCount() != null) alert.setAffectedPersonsCount(request.getAffectedPersonsCount());
        if (request.getEvacuationRequired() != null) alert.setEvacuationRequired(request.getEvacuationRequired());
        if (request.getResolutionNotes() != null) alert.setResolutionNotes(request.getResolutionNotes());

        alert = alertRepository.save(alert);
        return toResponse(alert);
    }

    public void deleteAlert(Long id) {
        if (!alertRepository.existsById(id)) {
            throw new ResourceNotFoundException("Alerte non trouvée avec l'ID: " + id);
        }
        alertRepository.deleteById(id);
    }

    private EmergencyAlertDTO.Response toResponse(EmergencyAlert alert) {
        return EmergencyAlertDTO.Response.builder()
                .id(alert.getId())
                .alertCode(alert.getAlertCode())
                .title(alert.getTitle())
                .description(alert.getDescription())
                .emergencyType(alert.getEmergencyType())
                .severity(alert.getSeverity())
                .status(alert.getStatus())
                .latitude(alert.getLatitude())
                .longitude(alert.getLongitude())
                .location(alert.getLocation())
                .instructions(alert.getInstructions())
                .emergencyContacts(alert.getEmergencyContacts())
                .affectedPersonsCount(alert.getAffectedPersonsCount())
                .evacuationRequired(alert.getEvacuationRequired())
                .notificationsSent(alert.getNotificationsSent())
                .reportedAt(alert.getReportedAt())
                .acknowledgedAt(alert.getAcknowledgedAt())
                .resolvedAt(alert.getResolvedAt())
                .resolutionNotes(alert.getResolutionNotes())
                .siteId(alert.getSite() != null ? alert.getSite().getId() : null)
                .siteName(alert.getSite() != null ? alert.getSite().getName() : null)
                .eventId(alert.getEvent() != null ? alert.getEvent().getId() : null)
                .eventTitle(alert.getEvent() != null ? alert.getEvent().getTitle() : null)
                .reportedById(alert.getReportedBy().getId())
                .reportedByName(alert.getReportedBy().getName())
                .acknowledgedById(alert.getAcknowledgedBy() != null ? alert.getAcknowledgedBy().getId() : null)
                .acknowledgedByName(alert.getAcknowledgedBy() != null ? alert.getAcknowledgedBy().getName() : null)
                .resolvedById(alert.getResolvedBy() != null ? alert.getResolvedBy().getId() : null)
                .resolvedByName(alert.getResolvedBy() != null ? alert.getResolvedBy().getName() : null)
                .createdAt(alert.getCreatedAt())
                .build();
    }
}
