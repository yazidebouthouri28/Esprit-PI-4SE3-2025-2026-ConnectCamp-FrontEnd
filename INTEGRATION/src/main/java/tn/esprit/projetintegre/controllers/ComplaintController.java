package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.entities.Complaint;
import tn.esprit.projetintegre.enums.ComplaintStatus;
import tn.esprit.projetintegre.services.ComplaintService;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Complaint management APIs")
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    @Operation(summary = "Get all complaints paginated")
    public ResponseEntity<ApiResponse<PageResponse<Complaint>>> getAllComplaints(Pageable pageable) {
        Page<Complaint> page = complaintService.getAllComplaints(pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get complaint by ID")
    public ResponseEntity<ApiResponse<Complaint>> getComplaintById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(complaintService.getComplaintById(id)));
    }

    @GetMapping("/number/{complaintNumber}")
    @Operation(summary = "Get complaint by number")
    public ResponseEntity<ApiResponse<Complaint>> getComplaintByNumber(@PathVariable String complaintNumber) {
        return ResponseEntity.ok(ApiResponse.success(complaintService.getComplaintByNumber(complaintNumber)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get complaints by user ID")
    public ResponseEntity<ApiResponse<PageResponse<Complaint>>> getComplaintsByUserId(@PathVariable Long userId, Pageable pageable) {
        Page<Complaint> page = complaintService.getComplaintsByUserId(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get complaints by status")
    public ResponseEntity<ApiResponse<PageResponse<Complaint>>> getComplaintsByStatus(@PathVariable ComplaintStatus status, Pageable pageable) {
        Page<Complaint> page = complaintService.getComplaintsByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @PostMapping
    @Operation(summary = "Create a new complaint")
    public ResponseEntity<ApiResponse<Complaint>> createComplaint(
            @RequestBody Complaint complaint,
            @RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Complaint created successfully",
                complaintService.createComplaint(complaint, userId)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a complaint")
    public ResponseEntity<ApiResponse<Complaint>> updateComplaint(
            @PathVariable Long id,
            @RequestBody Complaint complaintDetails) {
        return ResponseEntity.ok(ApiResponse.success("Complaint updated successfully",
                complaintService.updateComplaint(id, complaintDetails)));
    }

    @PutMapping("/{id}/assign")
    @Operation(summary = "Assign complaint to staff")
    public ResponseEntity<ApiResponse<Complaint>> assignComplaint(
            @PathVariable Long id,
            @RequestParam Long assignedToId) {
        return ResponseEntity.ok(ApiResponse.success("Complaint assigned successfully",
                complaintService.assignComplaint(id, assignedToId)));
    }

    @PutMapping("/{id}/resolve")
    @Operation(summary = "Resolve a complaint")
    public ResponseEntity<ApiResponse<Complaint>> resolveComplaint(
            @PathVariable Long id,
            @RequestParam String resolution) {
        return ResponseEntity.ok(ApiResponse.success("Complaint resolved successfully",
                complaintService.resolveComplaint(id, resolution)));
    }

    @PutMapping("/{id}/close")
    @Operation(summary = "Close a complaint")
    public ResponseEntity<ApiResponse<Complaint>> closeComplaint(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Complaint closed successfully",
                complaintService.closeComplaint(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a complaint")
    public ResponseEntity<ApiResponse<Void>> deleteComplaint(@PathVariable Long id) {
        complaintService.deleteComplaint(id);
        return ResponseEntity.ok(ApiResponse.success("Complaint deleted successfully", null));
    }
}
