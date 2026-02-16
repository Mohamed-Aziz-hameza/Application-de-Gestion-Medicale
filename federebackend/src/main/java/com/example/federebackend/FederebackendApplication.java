package com.example.federebackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FederebackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(FederebackendApplication.class, args);
	}

}
