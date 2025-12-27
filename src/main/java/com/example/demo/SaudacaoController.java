package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalTime;

@RestController
public class SaudacaoController {

    @GetMapping("/saudacao")
    public String saudacao() {
        LocalTime horaAtual = LocalTime.now();
        int hora = horaAtual.getHour();

        if (hora >= 6 && hora < 12) {
            return "Bom dia!";
        } else if (hora >= 12 && hora < 18) {
            return "Boa tarde!";
        } else {
            return "Boa noite!";
        }
    }
}