package com.example.federebackend.repository;

import com.example.federebackend.entity.StatusCompte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StatusCompteRepository extends JpaRepository<StatusCompte, Long> {
}
