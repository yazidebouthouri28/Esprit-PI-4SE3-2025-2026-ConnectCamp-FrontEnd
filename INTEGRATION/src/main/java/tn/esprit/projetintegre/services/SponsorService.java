package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Event;
import tn.esprit.projetintegre.entities.Sponsor;
import tn.esprit.projetintegre.entities.Sponsorship;
import tn.esprit.projetintegre.enums.SponsorTier;
import tn.esprit.projetintegre.exception.DuplicateResourceException;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.EventRepository;
import tn.esprit.projetintegre.repositories.SponsorRepository;
import tn.esprit.projetintegre.repositories.SponsorshipRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SponsorService {

    private final SponsorRepository sponsorRepository;
    private final SponsorshipRepository sponsorshipRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    // Sponsor methods
    public List<Sponsor> getAllSponsors() {
        return sponsorRepository.findAll();
    }

    public Page<Sponsor> getAllSponsors(Pageable pageable) {
        return sponsorRepository.findAll(pageable);
    }

    public Sponsor getSponsorById(Long id) {
        return sponsorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsor not found with id: " + id));
    }

    public List<Sponsor> getActiveSponsors() {
        return sponsorRepository.findByIsActiveTrue();
    }

    public List<Sponsor> searchSponsors(String keyword) {
        return sponsorRepository.searchByKeyword(keyword);
    }

    public Sponsor createSponsor(Sponsor sponsor) {
        if (sponsor.getEmail() != null && sponsorRepository.existsByEmail(sponsor.getEmail())) {
            throw new DuplicateResourceException("Sponsor with this email already exists");
        }
        sponsor.setIsActive(true);
        return sponsorRepository.save(sponsor);
    }

    public Sponsor updateSponsor(Long id, Sponsor sponsorDetails) {
        Sponsor sponsor = getSponsorById(id);
        sponsor.setName(sponsorDetails.getName());
        sponsor.setDescription(sponsorDetails.getDescription());
        sponsor.setLogo(sponsorDetails.getLogo());
        sponsor.setWebsite(sponsorDetails.getWebsite());
        sponsor.setEmail(sponsorDetails.getEmail());
        sponsor.setPhone(sponsorDetails.getPhone());
        sponsor.setAddress(sponsorDetails.getAddress());
        sponsor.setCity(sponsorDetails.getCity());
        sponsor.setCountry(sponsorDetails.getCountry());
        sponsor.setContactPerson(sponsorDetails.getContactPerson());
        sponsor.setContactPosition(sponsorDetails.getContactPosition());
        sponsor.setNotes(sponsorDetails.getNotes());
        sponsor.setTier(sponsorDetails.getTier() != null ? sponsorDetails.getTier() : SponsorTier.BRONZE);
        sponsor.setIsActive(sponsorDetails.getIsActive() != null ? sponsorDetails.getIsActive() : sponsor.getIsActive());
        
        Sponsor updatedSponsor = sponsorRepository.save(sponsor);
        
        // Sync logo with user avatar
        if (sponsor.getEmail() != null && sponsor.getLogo() != null) {
            userRepository.findByEmail(sponsor.getEmail()).ifPresent(user -> {
                user.setAvatar(sponsor.getLogo());
                userRepository.save(user);
            });
        }
        
        return updatedSponsor;
    }

    public void deleteSponsor(Long id) {
        Sponsor sponsor = getSponsorById(id);
        sponsor.setIsActive(false);
        sponsorRepository.save(sponsor);
    }

    // Sponsorship methods
    public List<Sponsorship> getAllSponsorships() {
        return sponsorshipRepository.findAll();
    }

    public Page<Sponsorship> getAllSponsorships(Pageable pageable) {
        return sponsorshipRepository.findAll(pageable);
    }

    public Sponsorship getSponsorshipById(Long id) {
        return sponsorshipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sponsorship not found with id: " + id));
    }

    public List<Sponsorship> getSponsorshipsBySponsorId(Long sponsorId) {
        return sponsorshipRepository.findBySponsor_Id(sponsorId);
    }

    public List<Sponsorship> getSponsorshipsByEventId(Long eventId) {
        return sponsorshipRepository.findByEvent_Id(eventId);
    }

    public Sponsorship createSponsorship(Sponsorship sponsorship, Long sponsorId, Long eventId) {
        Sponsor sponsor = getSponsorById(sponsorId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        sponsorship.setSponsor(sponsor);
        sponsorship.setEvent(event);
        sponsorship.setIsActive(true);
        sponsorship.setIsPaid(false);
        sponsorship.setStatus("PENDING");
        return sponsorshipRepository.save(sponsorship);
    }

    public Sponsorship updateSponsorship(Long id, Sponsorship sponsorshipDetails) {
        Sponsorship sponsorship = getSponsorshipById(id);
        sponsorship.setSponsorshipType(sponsorshipDetails.getSponsorshipType());
        sponsorship.setSponsorshipLevel(sponsorshipDetails.getSponsorshipLevel());
        sponsorship.setDescription(sponsorshipDetails.getDescription());
        sponsorship.setAmount(sponsorshipDetails.getAmount());
        sponsorship.setCurrency(sponsorshipDetails.getCurrency());
        sponsorship.setStartDate(sponsorshipDetails.getStartDate());
        sponsorship.setEndDate(sponsorshipDetails.getEndDate());
        sponsorship.setBenefits(sponsorshipDetails.getBenefits());
        sponsorship.setDeliverables(sponsorshipDetails.getDeliverables());
        sponsorship.setNotes(sponsorshipDetails.getNotes());
        return sponsorshipRepository.save(sponsorship);
    }

    public Sponsorship markAsPaid(Long id) {
        Sponsorship sponsorship = getSponsorshipById(id);
        sponsorship.setIsPaid(true);
        sponsorship.setPaidAt(LocalDateTime.now());
        sponsorship.setStatus("PAID");
        return sponsorshipRepository.save(sponsorship);
    }

    public Sponsorship updateStatus(Long id, String status) {
        Sponsorship sponsorship = getSponsorshipById(id);
        sponsorship.setStatus(status);
        return sponsorshipRepository.save(sponsorship);
    }

    public void deleteSponsorship(Long id) {
        Sponsorship sponsorship = getSponsorshipById(id);
        sponsorship.setIsActive(false);
        sponsorshipRepository.save(sponsorship);
    }
}
