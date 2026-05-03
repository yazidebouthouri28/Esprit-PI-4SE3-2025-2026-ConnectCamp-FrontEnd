package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Event;
import tn.esprit.projetintegre.entities.EventComment;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.EventCommentRepository;
import tn.esprit.projetintegre.repositories.EventRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EventCommentService {

    private final EventCommentRepository eventCommentRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public List<EventComment> getAllComments() {
        return eventCommentRepository.findAll();
    }

    public List<EventComment> getCommentsByEvent(Long eventId) {
        return eventCommentRepository.findByEventId(eventId);
    }

    public EventComment getCommentById(Long id) {
        return eventCommentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));
    }

    public EventComment createComment(Long eventId, Long userId, String content) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        EventComment comment = EventComment.builder()
                .event(event)
                .user(user)
                .content(content)
                .build();

        return eventCommentRepository.save(comment);
    }

    public EventComment updateComment(Long id, String content) {
        EventComment comment = getCommentById(id);
        comment.setContent(content);
        return eventCommentRepository.save(comment);
    }

    public void deleteComment(Long id) {
        EventComment comment = getCommentById(id);
        eventCommentRepository.delete(comment);
    }
}
