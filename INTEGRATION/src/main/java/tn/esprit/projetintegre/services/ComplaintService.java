package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Complaint;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.ComplaintStatus;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.ComplaintRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public Page<Complaint> getAllComplaints(Pageable pageable) {
        return complaintRepository.findAll(pageable);
    }

    public Complaint getComplaintById(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
    }

    public Complaint getComplaintByNumber(String complaintNumber) {
        return complaintRepository.findByComplaintNumber(complaintNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with number: " + complaintNumber));
    }

    public Page<Complaint> getComplaintsByUserId(Long userId, Pageable pageable) {
        return complaintRepository.findByUserId(userId, pageable);
    }

    public Page<Complaint> getComplaintsByStatus(ComplaintStatus status, Pageable pageable) {
        return complaintRepository.findByStatus(status, pageable);
    }

    public Complaint createComplaint(Complaint complaint, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        complaint.setUser(user);
        complaint.setStatus(ComplaintStatus.OPEN);
        return complaintRepository.save(complaint);
    }

    public Complaint updateComplaint(Long id, Complaint complaintDetails) {
        Complaint complaint = getComplaintById(id);
        complaint.setSubject(complaintDetails.getSubject());
        complaint.setDescription(complaintDetails.getDescription());
        complaint.setCategory(complaintDetails.getCategory());
        complaint.setPriority(complaintDetails.getPriority());
        return complaintRepository.save(complaint);
    }

    public Complaint assignComplaint(Long id, Long assignedToId) {
        Complaint complaint = getComplaintById(id);
        User assignedTo = userRepository.findById(assignedToId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + assignedToId));

        complaint.setAssignedTo(assignedTo);
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        return complaintRepository.save(complaint);
    }

    public Complaint resolveComplaint(Long id, String resolution) {
        Complaint complaint = getComplaintById(id);
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolution(resolution);
        complaint.setResolvedAt(LocalDateTime.now());
        return complaintRepository.save(complaint);
    }

    public Complaint closeComplaint(Long id) {
        Complaint complaint = getComplaintById(id);
        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setClosedAt(LocalDateTime.now());
        return complaintRepository.save(complaint);
    }

    public void deleteComplaint(Long id) {
        Complaint complaint = getComplaintById(id);
        complaintRepository.delete(complaint);
    }
}
