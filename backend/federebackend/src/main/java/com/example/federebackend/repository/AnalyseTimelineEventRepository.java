package com.example.federebackend.repository;

import com.example.federebackend.entity.AnalyseTimelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalyseTimelineEventRepository extends JpaRepository<AnalyseTimelineEvent, Long> {

    List<AnalyseTimelineEvent> findByAnalyseIdOrderByCreatedAtDesc(Long analyseId);
}
