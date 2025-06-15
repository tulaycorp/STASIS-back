package com.stasis.stasis.repository;

import com.stasis.stasis.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {
    Users findByUsername(String username);
    boolean existsByUsername(String username);
}