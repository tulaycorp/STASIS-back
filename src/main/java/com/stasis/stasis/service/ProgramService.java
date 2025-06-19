package com.stasis.stasis.service;

import com.stasis.stasis.model.Program;
import com.stasis.stasis.repository.ProgramRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProgramService {

    @Autowired
    private ProgramRepository programRepository;

    public List<Program> getAllPrograms() {
        return programRepository.findAll();
    }

    public Optional<Program> getProgramById(Long id) {
        return programRepository.findById(id);
    }

    public Program createProgram(Program program) {
        return programRepository.save(program);
    }

    public Program updateProgram(Long id, Program programDetails) {
        return programRepository.findById(id)
            .map(program -> {
                program.setProgramName(programDetails.getProgramName());
                if (programDetails.getChairFaculty() != null) {
                    program.setChairFaculty(programDetails.getChairFaculty());
                }
                return programRepository.save(program);
            })
            .orElseThrow(() -> new RuntimeException("Program not found with id: " + id));
    }

    public void deleteProgram(Long id) {
        programRepository.deleteById(id);
    }
}
