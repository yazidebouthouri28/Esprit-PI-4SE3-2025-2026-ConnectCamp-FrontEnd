package tn.esprit.projetintegre.aspects;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang .JoinPoint;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Aspect

public class LoggingAspect {
    @Pointcut("execution(* tn.esprit.projetintegre.services.*.get*(..))")
    public void methodCall() {}

    @After("methodCall() ")
    public void logMethodExit(JoinPoint joinPoint) {
        String name = joinPoint.getSignature().getName();
        log.info("Bon courage !");
    }
//    @AfterReturning("methodCall()")
//    public void logMethodExitReturn(JoinPoint joinPoint) {
//        String name = joinPoint.getSignature().getName();
//        log.info("AfterReturning of method " + name + " : ");
//    }

//    @AfterThrowing(pointcut="methodCall()", throwing="nameEx")
//    public void logMethodExitThrowing(JoinPoint joinPoint, Throwable nameEx) {
//        String name = joinPoint.getSignature().getName();
//        log.info("AfterThrowing of method " + name + " : ");
//        log.error(nameEx.getMessage());
//    }
}
