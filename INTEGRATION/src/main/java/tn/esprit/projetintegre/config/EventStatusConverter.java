package tn.esprit.projetintegre.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import tn.esprit.projetintegre.enums.EventStatus;

@Converter(autoApply = true)
public class EventStatusConverter implements AttributeConverter<EventStatus, String> {

    @Override
    public String convertToDatabaseColumn(EventStatus status) {
        if (status == null) {
            return null;
        }
        return status.name();
    }

    @Override
    public EventStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        try {
            return EventStatus.valueOf(dbData.toUpperCase());
        } catch (IllegalArgumentException e) {
            return EventStatus.DRAFT; // Default fallback
        }
    }
}
