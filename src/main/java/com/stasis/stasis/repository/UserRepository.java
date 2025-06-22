package com.stasis.stasis.repository;

import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {
    Users findByUsername(String username);
    boolean existsByUsername(String username);
    List<Users> findByUsernameStartingWith(String prefix);
    Optional<Users> findByFirstNameAndLastNameAndRole(String firstName, String lastName, UserRole role);
}
