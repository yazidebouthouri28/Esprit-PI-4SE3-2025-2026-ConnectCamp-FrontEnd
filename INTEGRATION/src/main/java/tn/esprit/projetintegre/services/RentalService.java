package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.request.RentalRequest;
import tn.esprit.projetintegre.dto.response.RentalResponse;
import tn.esprit.projetintegre.dto.response.RentalProductResponse;
import tn.esprit.projetintegre.entities.*;
import tn.esprit.projetintegre.enums.RentalStatus;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RentalService {

    private final RentalRepository rentalRepository;
    private final RentalProductRepository rentalProductRepository;
    private final UserRepository userRepository;
    private final SiteRepository siteRepository;
    private final ProductRepository productRepository;

    public List<RentalResponse> getAll() {
        return rentalRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<RentalResponse> getByUserId(Long userId, Pageable pageable) {
        return rentalRepository.findByUserId(userId, pageable).map(this::toResponse);
    }

    public RentalResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public RentalResponse getByRentalNumber(String number) {
        return toResponse(rentalRepository.findByRentalNumber(number)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "numéro", number)));
    }

    public RentalResponse create(RentalRequest request) {
        Rental rental = new Rental();
        rental.setStartDate(request.getStartDate());
        rental.setEndDate(request.getEndDate());
        rental.setDeposit(request.getDeposit() != null ? request.getDeposit() : BigDecimal.ZERO);
        rental.setNotes(request.getNotes());
        rental.setStatus(RentalStatus.PENDING);
        
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", request.getUserId()));
        rental.setUser(user);
        
        if (request.getSiteId() != null) {
            Site site = siteRepository.findById(request.getSiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Site", "id", request.getSiteId()));
            rental.setSite(site);
        }
        
        rental = rentalRepository.save(rental);
        
        // Calculate totals
        BigDecimal subtotal = BigDecimal.ZERO;
        long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        
        if (request.getItems() != null) {
            for (var itemRequest : request.getItems()) {
                RentalProduct item = new RentalProduct();
                item.setProductName(itemRequest.getProductName());
                item.setDescription(itemRequest.getDescription());
                item.setQuantity(itemRequest.getQuantity());
                item.setDailyRate(itemRequest.getDailyRate());
                item.setDepositRequired(itemRequest.getDepositRequired() != null ? itemRequest.getDepositRequired() : BigDecimal.ZERO);
                item.setInitialCondition(itemRequest.getInitialCondition());
                item.setRental(rental);
                
                BigDecimal itemTotal = itemRequest.getDailyRate()
                        .multiply(BigDecimal.valueOf(days))
                        .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
                item.setTotalPrice(itemTotal);
                subtotal = subtotal.add(itemTotal);
                
                if (itemRequest.getProductId() != null) {
                    Product product = productRepository.findById(itemRequest.getProductId()).orElse(null);
                    item.setProduct(product);
                }
                
                rentalProductRepository.save(item);
            }
        }
        
        rental.setSubtotal(subtotal);
        rental.setTotalAmount(subtotal.add(rental.getDeposit()));
        
        return toResponse(rentalRepository.save(rental));
    }

    public RentalResponse updateStatus(Long id, RentalStatus status) {
        Rental rental = findById(id);
        rental.setStatus(status);
        if (status == RentalStatus.RETURNED) {
            rental.setActualReturnDate(LocalDate.now());
        }
        return toResponse(rentalRepository.save(rental));
    }

    public void delete(Long id) {
        if (!rentalRepository.existsById(id)) {
            throw new ResourceNotFoundException("Location", "id", id);
        }
        rentalRepository.deleteById(id);
    }

    private Rental findById(Long id) {
        return rentalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));
    }

    private RentalResponse toResponse(Rental r) {
        return RentalResponse.builder()
                .id(r.getId())
                .rentalNumber(r.getRentalNumber())
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .actualReturnDate(r.getActualReturnDate())
                .status(r.getStatus())
                .subtotal(r.getSubtotal())
                .deposit(r.getDeposit())
                .discount(r.getDiscount())
                .totalAmount(r.getTotalAmount())
                .lateFees(r.getLateFees())
                .notes(r.getNotes())
                .returnCondition(r.getReturnCondition())
                .depositReturned(r.getDepositReturned())
                .userId(r.getUser().getId())
                .userName(r.getUser().getName())
                .siteId(r.getSite() != null ? r.getSite().getId() : null)
                .siteName(r.getSite() != null ? r.getSite().getName() : null)
                .items(r.getItems().stream()
                        .map(i -> RentalProductResponse.builder()
                                .id(i.getId())
                                .productName(i.getProductName())
                                .description(i.getDescription())
                                .quantity(i.getQuantity())
                                .dailyRate(i.getDailyRate())
                                .totalPrice(i.getTotalPrice())
                                .depositRequired(i.getDepositRequired())
                                .status(i.getStatus())
                                .initialCondition(i.getInitialCondition())
                                .returnCondition(i.getReturnCondition())
                                .notes(i.getNotes())
                                .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                                .build())
                        .collect(Collectors.toList()))
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
