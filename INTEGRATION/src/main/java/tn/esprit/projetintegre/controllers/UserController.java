package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.dto.UserDTO;
import tn.esprit.projetintegre.dto.request.ChangePasswordRequest;
import tn.esprit.projetintegre.dto.request.ProfileUpdateRequest;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.Role;
import tn.esprit.projetintegre.services.UserService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users (Admin only)")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers().stream()
                .map(userService::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active users with pagination")
    public ResponseEntity<ApiResponse<PageResponse<UserDTO>>> getActiveUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<User> users = userService.getActiveUsers(PageRequest.of(page, size));
        Page<UserDTO> userDTOs = users.map(userService::toDTO);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(userDTOs)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search users")
    public ResponseEntity<ApiResponse<PageResponse<UserDTO>>> searchUsers(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<User> users = userService.searchUsers(keyword, PageRequest.of(page, size));
        Page<UserDTO> userDTOs = users.map(userService::toDTO);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(userDTOs)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(
            @PathVariable Long id,
            Authentication authentication) {
        assertCanAccessUser(id, authentication);
        UserDTO user = userService.toDTO(userService.getUserById(id));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user profile (self or admin)")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserProfile(
            @PathVariable Long id,
            @Valid @RequestBody ProfileUpdateRequest request,
            Authentication authentication) {
        assertCanAccessUser(id, authentication);
        try {
            UserDTO user = userService.toDTO(userService.updateUserProfile(id, request));
            return ResponseEntity.ok(ApiResponse.success("User updated successfully", user));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/change-password")
    @Operation(summary = "Change password (self or admin)")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        assertCanAccessUser(id, authentication);
        try {
            userService.changePassword(id, request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(ApiResponse.success("Password updated successfully", null));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    private void assertCanAccessUser(Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
        if (isAdmin) {
            return;
        }
        User target = userService.getUserById(id);
        String name = authentication.getName();
        if (name != null && name.equalsIgnoreCase(target.getUsername())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own account");
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user role (Admin only)")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserRole(@PathVariable Long id, @RequestParam Role role) {
        UserDTO user = userService.toDTO(userService.updateUserRole(id, role));
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", user));
    }

    @PostMapping("/{id}/become-seller")
    @Operation(summary = "Become a seller")
    public ResponseEntity<ApiResponse<UserDTO>> becomeSeller(
            @PathVariable Long id,
            @RequestParam String storeName,
            @RequestParam(required = false) String storeDescription) {
        UserDTO user = userService.toDTO(userService.becomeSeller(id, storeName, storeDescription));
        return ResponseEntity.ok(ApiResponse.success("You are now a seller", user));
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Suspend user (Admin only)")
    public ResponseEntity<ApiResponse<UserDTO>> suspendUser(@PathVariable Long id, @RequestParam String reason) {
        UserDTO user = userService.toDTO(userService.suspendUser(id, reason));
        return ResponseEntity.ok(ApiResponse.success("User suspended", user));
    }

    @PostMapping("/{id}/unsuspend")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Unsuspend user (Admin only)")
    public ResponseEntity<ApiResponse<UserDTO>> unsuspendUser(@PathVariable Long id) {
        UserDTO user = userService.toDTO(userService.unsuspendUser(id));
        return ResponseEntity.ok(ApiResponse.success("User unsuspended", user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }
}
