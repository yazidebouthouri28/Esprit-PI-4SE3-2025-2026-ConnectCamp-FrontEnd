package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Alert;
import tn.esprit.projetintegre.entities.Site;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.AlertStatus;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.AlertRepository;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AlertService {

    private final AlertRepository alertRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;

    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    public Page<Alert> getAllAlerts(Pageable pageable) {
        return alertRepository.findAll(pageable);
    }

    public Alert getAlertById(Long id) {
        return alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + id));
    }

    public List<Alert> getAlertsByStatus(AlertStatus status) {
        return alertRepository.findByStatus(status);
    }

    public Page<Alert> getAlertsBySiteId(Long siteId, Pageable pageable) {
        return alertRepository.findBySiteId(siteId, pageable);
    }

    public Alert createAlert(Alert alert, Long reportedById, Long siteId) {
        User reporter = userRepository.findById(reportedById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + reportedById));
        alert.setReportedBy(reporter);

        if (siteId != null) {
            Site site = siteRepository.findById(siteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Site not found with id: " + siteId));
            alert.setSite(site);
        }

        alert.setStatus(AlertStatus.ACTIVE);
        alert.setReportedAt(LocalDateTime.now());
        return alertRepository.save(alert);
    }

    public Alert updateAlert(Long id, Alert alertDetails) {
        Alert alert = getAlertById(id);
        alert.setTitle(alertDetails.getTitle());
        alert.setDescription(alertDetails.getDescription());
        alert.setAlertType(alertDetails.getAlertType());
        alert.setSeverity(alertDetails.getSeverity());
        alert.setLocation(alertDetails.getLocation());
        alert.setLatitude(alertDetails.getLatitude());
        alert.setLongitude(alertDetails.getLongitude());
        return alertRepository.save(alert);
    }

    public Alert resolveAlert(Long id, Long resolvedById, String resolutionNotes) {
        Alert alert = getAlertById(id);
        User resolver = userRepository.findById(resolvedById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + resolvedById));

        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedBy(resolver);
        alert.setResolvedAt(LocalDateTime.now());
        alert.setResolutionNotes(resolutionNotes);
        return alertRepository.save(alert);
    }

    public Alert updateStatus(Long id, AlertStatus status) {
        Alert alert = getAlertById(id);
        alert.setStatus(status);
        return alertRepository.save(alert);
    }

    public void deleteAlert(Long id) {
        Alert alert = getAlertById(id);
        alertRepository.delete(alert);
    }
}
