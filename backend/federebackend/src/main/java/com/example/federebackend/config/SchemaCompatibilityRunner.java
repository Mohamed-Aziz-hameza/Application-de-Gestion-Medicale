package com.example.federebackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class SchemaCompatibilityRunner implements ApplicationRunner {

    private static final Set<String> TEXT_TYPES = Set.of("text", "mediumtext", "longtext");

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            String dataType = jdbcTemplate.queryForObject(
                    """
                    SELECT DATA_TYPE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'analyse_resultat'
                      AND COLUMN_NAME = 'intervalle_reference'
                    """,
                    String.class
            );

            if (!StringUtils.hasText(dataType)) {
                return;
            }

            if (!TEXT_TYPES.contains(dataType.trim().toLowerCase())) {
                jdbcTemplate.execute(
                        "ALTER TABLE analyse_resultat MODIFY COLUMN intervalle_reference LONGTEXT NULL"
                );
                log.info("Schema updated: analyse_resultat.intervalle_reference -> LONGTEXT");
            }
        } catch (Exception ex) {
            log.warn("Could not enforce LONGTEXT for analyse_resultat.intervalle_reference: {}", ex.getMessage());
        }
    }
}
