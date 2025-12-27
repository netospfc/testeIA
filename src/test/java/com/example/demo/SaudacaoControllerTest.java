package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.time.LocalTime;

import static org.mockito.Mockito.mockStatic;

@WebMvcTest(SaudacaoController.class)
public class SaudacaoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testSaudacaoBomDia() throws Exception {
        LocalTime morning = LocalTime.of(9, 0);
        try (var mockedLocalTime = mockStatic(LocalTime.class)) {
            mockedLocalTime.when(LocalTime::now).thenReturn(morning);

            mockMvc.perform(MockMvcRequestBuilders.get("/saudacao"))
                    .andExpect(MockMvcResultMatchers.status().isOk())
                    .andExpect(MockMvcResultMatchers.content().string("Bom dia!"));
        }
    }

    @Test
    public void testSaudacaoBoaTarde() throws Exception {
        LocalTime afternoon = LocalTime.of(15, 0);
        try (var mockedLocalTime = mockStatic(LocalTime.class)) {
            mockedLocalTime.when(LocalTime::now).thenReturn(afternoon);

            mockMvc.perform(MockMvcRequestBuilders.get("/saudacao"))
                    .andExpect(MockMvcResultMatchers.status().isOk())
                    .andExpect(MockMvcResultMatchers.content().string("Boa tarde!"));
        }
    }

    @Test
    public void testSaudacaoBoaNoite() throws Exception {
        LocalTime night = LocalTime.of(21, 0);
        try (var mockedLocalTime = mockStatic(LocalTime.class)) {
            mockedLocalTime.when(LocalTime::now).thenReturn(night);

            mockMvc.perform(MockMvcRequestBuilders.get("/saudacao"))
                    .andExpect(MockMvcResultMatchers.status().isOk())
                    .andExpect(MockMvcResultMatchers.content().string("Boa noite!"));
        }
    }
}