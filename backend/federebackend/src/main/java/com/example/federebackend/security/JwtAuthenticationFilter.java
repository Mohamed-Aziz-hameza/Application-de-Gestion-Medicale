package com.example.federebackend.security;

import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.repository.UtilisateurRepository;
import com.example.federebackend.service.TokenBlacklistService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UtilisateurRepository utilisateurRepository;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String jwt = parseJwt(request);

        if (jwt != null && jwtUtils.validateToken(jwt) && !tokenBlacklistService.isBlacklisted(jwt)) {
            Long utilisateurId = jwtUtils.getUtilisateurIdFromToken(jwt);
            String typeUtilisateur = jwtUtils.getTypeUtilisateurFromToken(jwt);

            Optional<Utilisateur> optUser = utilisateurRepository.findById(utilisateurId);
            if (optUser.isPresent()) {
                Utilisateur utilisateur = optUser.get();
                String role = mapTypeToRole(typeUtilisateur);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                utilisateur,
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority(role))
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }

    private String mapTypeToRole(String typeUtilisateur) {
        return switch (typeUtilisateur) {
            case "Administrateur" -> "ROLE_ADMIN";
            case "Medecin" -> "ROLE_MEDECIN";
            case "Patient" -> "ROLE_PATIENT";
            default -> "ROLE_USER";
        };
    }
}
