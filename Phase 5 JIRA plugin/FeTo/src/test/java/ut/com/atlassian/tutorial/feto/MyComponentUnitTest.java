package ut.com.atlassian.tutorial.feto;

import org.junit.Test;
import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.*;

import com.atlassian.sal.api.ApplicationProperties;
import com.atlassian.tutorial.feto.api.MyPluginComponent;
import com.atlassian.tutorial.feto.impl.MyPluginComponentImpl;
import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.tutorial.feto.support.QueryDslSupport;

public class MyComponentUnitTest {

    @Test
    public void testMyName() {
        ActiveObjects ao = mock(ActiveObjects.class);
        QueryDslSupport queryDslSupport = mock(QueryDslSupport.class);
        ApplicationProperties applicationProperties = mock(ApplicationProperties.class);
        when(applicationProperties.getDisplayName()).thenReturn("FeTo");

        MyPluginComponent component = new MyPluginComponentImpl(ao, queryDslSupport, applicationProperties);

        assertEquals("names do not match!", "myComponent:FeTo", component.getName());
    }
}
