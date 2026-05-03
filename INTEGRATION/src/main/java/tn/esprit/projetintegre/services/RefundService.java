package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Order;
import tn.esprit.projetintegre.entities.Refund;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.PaymentStatus;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.OrderRepository;
import tn.esprit.projetintegre.repositories.RefundRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class RefundService {

    private final RefundRepository refundRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public Page<Refund> getAllRefunds(Pageable pageable) {
        return refundRepository.findAll(pageable);
    }

    public Refund getRefundById(Long id) {
        return refundRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Refund not found with id: " + id));
    }

    public Refund getRefundByNumber(String refundNumber) {
        return refundRepository.findByRefundNumber(refundNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Refund not found with number: " + refundNumber));
    }

    public Page<Refund> getRefundsByUserId(Long userId, Pageable pageable) {
        return refundRepository.findByUserId(userId, pageable);
    }

    public Page<Refund> getRefundsByOrderId(Long orderId, Pageable pageable) {
        return refundRepository.findByOrderId(orderId, pageable);
    }

    public Page<Refund> getRefundsByStatus(PaymentStatus status, Pageable pageable) {
        return refundRepository.findByStatus(status, pageable);
    }

    public Refund createRefund(Refund refund, Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        refund.setOrder(order);
        refund.setUser(user);
        refund.setStatus(PaymentStatus.PENDING);
        refund.setRequestedAt(LocalDateTime.now());
        
        if (refund.getAmount() == null) {
            refund.setAmount(order.getTotalAmount());
        }
        
        return refundRepository.save(refund);
    }

    public Refund approveRefund(Long id, String transactionId) {
        Refund refund = getRefundById(id);
        refund.setStatus(PaymentStatus.COMPLETED);
        refund.setTransactionId(transactionId);
        refund.setProcessedAt(LocalDateTime.now());
        return refundRepository.save(refund);
    }

    public Refund rejectRefund(Long id, String adminNotes) {
        Refund refund = getRefundById(id);
        refund.setStatus(PaymentStatus.FAILED);
        refund.setAdminNotes(adminNotes);
        refund.setProcessedAt(LocalDateTime.now());
        return refundRepository.save(refund);
    }

    public void deleteRefund(Long id) {
        Refund refund = getRefundById(id);
        refundRepository.delete(refund);
    }
}
