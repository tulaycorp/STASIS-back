package com.stasis.stasis.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @GetMapping("/auth")
    public Map<String, Object> getAuthInfo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> info = new HashMap<>();
        
        if (auth == null) {
            info.put("authenticated", false);
            info.put("message", "No authentication found in SecurityContext");
        } else {
            info.put("authenticated", auth.isAuthenticated());
            info.put("name", auth.getName());
            info.put("principal", auth.getPrincipal().toString());
            info.put("authorities", auth.getAuthorities().toString());
            info.put("details", auth.getDetails());
        }
        
        return info;
    }
}
