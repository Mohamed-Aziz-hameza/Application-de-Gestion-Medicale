package com.example.federebackend.repository;

import com.example.federebackend.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Integer> {

    List<Otp> findByEmailOrderByDateCreationDesc(String email);

    Optional<Otp> findTopByEmailAndUtiliseFalseOrderByDateCreationDesc(String email);
}
