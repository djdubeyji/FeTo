package ut.com.atlassian.tutorial.feto;

import org.junit.Test;
import com.atlassian.tutorial.feto.api.MyPluginComponent;
import com.atlassian.tutorial.feto.impl.MyPluginComponentImpl;

import static org.junit.Assert.assertEquals;

public class MyComponentUnitTest {
    @Test
    public void testMyName() {
        MyPluginComponent component = new MyPluginComponentImpl(null);
        assertEquals("names do not match!", "myComponent", component.getName());
    }
}